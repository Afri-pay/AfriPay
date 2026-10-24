'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AddressText } from '@/components/ui/Address';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/Notice';
import { isValidPublicKey, MEMO_MAX_BYTES, memoByteLength } from '@/lib/address';
import { apiFetch } from '@/lib/api';
import { explorerTxUrl, formatAmount, shortAddress, stroopsToXlm, totalWithFee } from '@/lib/format';
import { signTransactionXdr } from '@/lib/stellar';
import { PendingPaymentNotice } from './PendingPaymentNotice';
import { usePendingPayment } from './usePendingPayment';
import { pendingPaymentKey, useWallet } from './WalletProvider';

export type PaymentRequest = { creator: string; amount?: string; reference?: string; expiresAt?: string };
type Review = { id: string; xdr: string; fee: string; recipient: string; amount: string; memo: string };
type Result = { status: 'SUCCEEDED' | 'FAILED'; transactionHash: string; amount: string; recipient: string };

const AMOUNT_PATTERN = /^\d{1,12}(\.\d{1,7})?$/;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[132px_1fr] sm:gap-4">
      <dt className="text-[13px] text-ink-2">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export function SendFlow({ request }: { request?: PaymentRequest }) {
  const wallet = useWallet();
  const pending = usePendingPayment();
  const [recipient, setRecipient] = useState(request?.creator ?? '');
  const [amount, setAmount] = useState(request?.amount ?? '');
  const [memo, setMemo] = useState(request?.reference ?? '');
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<'recipient' | 'amount' | 'memo', boolean>>({ recipient: false, amount: false, memo: false });
  const [review, setReview] = useState<Review | null>(null);
  const [unconfirmedHash, setUnconfirmedHash] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const pendingPayment = useRef<{ id: string; signedXdr: string } | null>(null);
  const { activated, xlm } = wallet.account;

  const errors = {
    recipient: !recipient.trim() ? 'Enter the recipient’s Stellar address.'
      : !isValidPublicKey(recipient) ? 'That isn’t a valid Stellar address. It should start with G and be 56 characters.'
      : recipient.trim() === wallet.address ? 'This is your own address.' : null,
    amount: !amount ? 'Enter an amount.'
      : !AMOUNT_PATTERN.test(amount) ? 'Use a number with up to 7 decimal places.'
      : Number(amount) <= 0 ? 'The amount must be more than zero.'
      : xlm !== null && Number(amount) > Number(xlm) ? 'That’s more than your balance.' : null,
    memo: memoByteLength(memo) > MEMO_MAX_BYTES ? `Memos are limited to ${MEMO_MAX_BYTES} bytes.` : null,
  };
  const shown = (field: keyof typeof errors) => (attempted || touched[field] ? errors[field] : null);
  const blockedReason = wallet.apiConfigError ?? (activated === false ? 'This account isn’t active on Stellar yet. Fund it from the Overview page before sending.' : null);

  async function prepare(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    setAttempted(true);
    if (errors.recipient || errors.amount || errors.memo || blockedReason) return;
    if (!wallet.address) return setError('Unlock your wallet before sending.');
    if (window.localStorage.getItem(pendingPaymentKey(wallet.address))) { pending.reload(); return setError('Resolve the unconfirmed payment above before creating another one.'); }
    sending.current = true; setBusy(true); setError(null);
    try {
      const to = recipient.trim();
      const response = await apiFetch('/payments/intents', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ sender: wallet.address, recipient: to, amount, memo, asset: 'XLM' }) });
      const intent = await response.json();
      const prepared = await (await apiFetch(`/payments/intents/${intent.id}/transaction`, { method: 'POST' })).json();
      if (prepared.network !== 'testnet') throw new Error('Unexpected transaction network');
      setReview({ id: intent.id, xdr: prepared.xdr, fee: prepared.fee, recipient: to, amount, memo });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to prepare this payment.'); }
    finally { sending.current = false; setBusy(false); }
  }

  async function confirm() {
    if (sending.current || !review) return;
    if (!wallet.secret || !wallet.address) return setError('Unlock your wallet before signing.');
    sending.current = true; setBusy(true); setError(null);
    try {
      if (!pendingPayment.current) {
        const signedXdr = signTransactionXdr(wallet.secret, review.xdr, review);
        pendingPayment.current = { id: review.id, signedXdr };
        // Public metadata only. Recover status after refresh without storing signing material.
        window.localStorage.setItem(pendingPaymentKey(wallet.address), review.id);
      }
      const current = pendingPayment.current;
      const outcome = await (await apiFetch(`/payments/intents/${current.id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signedXdr: current.signedXdr }) })).json();
      if (outcome.status === 'PENDING') { setUnconfirmedHash(outcome.transactionHash ?? ''); return; }
      finish({ status: outcome.status === 'SUCCEEDED' ? 'SUCCEEDED' : 'FAILED', transactionHash: outcome.transactionHash, amount: review.amount, recipient: review.recipient });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to verify payment. Check its status before sending again.'); }
    finally { sending.current = false; setBusy(false); }
  }

  function finish(next: Result) {
    pendingPayment.current = null;
    if (wallet.address) window.localStorage.removeItem(pendingPaymentKey(wallet.address));
    pending.reload();
    setReview(null); setUnconfirmedHash(null); setResult(next);
    wallet.refreshAccount();
  }

  async function checkUnconfirmed() {
    const outcome = await pending.check();
    pending.clearOutcome();
    if (!outcome || !review) return;
    if ('error' in outcome) return setError(outcome.error);
    if (outcome.status === 'PENDING') return setError('Still not confirmed. Check again shortly, or retry the same transaction.');
    finish({ status: outcome.status === 'SUCCEEDED' ? 'SUCCEEDED' : 'FAILED', transactionHash: outcome.transactionHash ?? '', amount: review.amount, recipient: review.recipient });
  }

  function startOver() {
    setResult(null); setAttempted(false); setTouched({ recipient: false, amount: false, memo: false }); setError(null);
    if (!request) { setRecipient(''); setAmount(''); setMemo(''); }
  }

  if (result) {
    const succeeded = result.status === 'SUCCEEDED';
    return (
      <div className="rounded-lg border border-line bg-surface p-6 text-center sm:p-8">
        <span className={`mx-auto grid size-11 place-items-center rounded-full ${succeeded ? 'bg-primary-soft text-positive' : 'bg-negative-soft text-negative'}`}>
          <Icon name={succeeded ? 'check' : 'alert'} size={22} />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{succeeded ? 'Payment sent' : 'Payment failed'}</h2>
        <p className="mt-1 text-sm text-ink-2">
          {succeeded ? <>{formatAmount(result.amount)} XLM to <span className="font-mono">{shortAddress(result.recipient)}</span> was confirmed on Stellar Testnet.</> : 'Stellar rejected this transaction. No funds left your account.'}
        </p>
        {result.transactionHash && (
          <a href={explorerTxUrl(result.transactionHash)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            View on Stellar Expert <Icon name="external" size={15} />
          </a>
        )}
        {!request && (
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={startOver}>{succeeded ? 'Send another' : 'Try again'}</Button>
            <ButtonLink href="/" variant="primary">Done</ButtonLink>
          </div>
        )}
      </div>
    );
  }

  if (review) {
    const total = totalWithFee(review.amount, review.fee);
    const signed = Boolean(pendingPayment.current);
    return (
      <div className="grid grid-cols-1 gap-4">
        {unconfirmedHash !== null && (
          <Notice tone="warning" title="Settlement unconfirmed">
            Stellar hasn’t confirmed transaction {unconfirmedHash ? <span className="font-mono">{shortAddress(unconfirmedHash)}</span> : ''} yet. Retry the same transaction or check its status. Don’t create a new payment.
          </Notice>
        )}
        <section className="rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-5">
            <p className="text-[13px] text-ink-2">You’re sending</p>
            <p className="mt-1 text-[30px] font-semibold tracking-[-0.02em] tabular-nums">{formatAmount(review.amount)} <span className="text-lg font-medium text-ink-2">XLM</span></p>
          </div>
          <dl className="divide-y divide-line px-5">
            <Row label="To"><AddressText address={review.recipient} /></Row>
            <Row label="Memo">{review.memo || <span className="text-ink-3">None</span>}</Row>
            <Row label="Network fee"><span className="tabular-nums">{stroopsToXlm(review.fee)} XLM</span> <span className="text-ink-3">· {review.fee} stroops</span></Row>
            <Row label="Network">Stellar Testnet</Row>
            {total && <Row label="Total"><span className="font-medium tabular-nums">{total} XLM</span></Row>}
          </dl>
        </section>
        <p className="flex gap-2 text-[13px] text-ink-2"><Icon name="lock" size={15} className="mt-0.5 shrink-0" />Your key signs this transaction on this device. Check the address. Stellar payments can’t be reversed.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap justify-end gap-2">
          {signed
            ? <Button onClick={checkUnconfirmed} disabled={busy || pending.checking}>{pending.checking ? 'Checking…' : 'Check status'}</Button>
            : <Button onClick={() => { setReview(null); setError(null); }} disabled={busy}>Edit</Button>}
          <Button variant="primary" onClick={confirm} disabled={busy}>{busy ? 'Submitting…' : signed ? 'Retry same transaction' : 'Confirm and sign'}</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={prepare} className="grid grid-cols-1 gap-4" noValidate>
      <PendingPaymentNotice pending={pending} />
      {blockedReason && <Notice tone="warning">{blockedReason}</Notice>}
      {/* A payment link fixes the recipient and may fix amount and memo; the request summary already shows those. */}
      {request && (
        <p className="flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-lg border border-line bg-surface px-5 py-3.5 text-[13px] text-ink-2">
          <span>Paying from <span className="font-mono text-ink">{wallet.address && shortAddress(wallet.address)}</span></span>
          {xlm !== null && <span>Balance <span className="tabular-nums text-ink">{formatAmount(xlm)} XLM</span></span>}
        </p>
      )}
      {(!request || !request.amount || !request.reference) && (
        <div className="grid gap-5 rounded-lg border border-line bg-surface p-5">
          {!request && (
            <TextField label="Recipient address" mono placeholder="G…" autoComplete="off" spellCheck={false}
              value={recipient} onChange={(e) => setRecipient(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, recipient: true }))} error={shown('recipient')} />
          )}
          {!request?.amount && (
            <TextField label="Amount" inputMode="decimal" placeholder="0.00" suffix="XLM" autoComplete="off"
              aside={!request && xlm !== null ? <>Balance <span className="tabular-nums">{formatAmount(xlm)}</span></> : undefined}
              value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} onBlur={() => setTouched((t) => ({ ...t, amount: true }))} error={shown('amount')} />
          )}
          {!request?.reference && (
            <TextField label="Memo" placeholder="Optional" autoComplete="off"
              hint="Some exchanges require a memo to credit your deposit." value={memo} onChange={(e) => setMemo(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, memo: true }))} error={shown('memo')} />
          )}
        </div>
      )}
      {request && errors.recipient && <Notice tone="error">{recipient.trim() === wallet.address ? 'This payment link was created by this wallet, so you can’t pay it from here.' : 'This payment link has an invalid recipient address and can’t be paid.'}</Notice>}
      {request?.amount && attempted && errors.amount && <Notice tone="error">{errors.amount}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-ink-2">The network fee is shown before you sign.</p>
        <Button type="submit" variant="primary" disabled={busy || Boolean(blockedReason)}>{busy ? 'Preparing…' : 'Review payment'}</Button>
      </div>
    </form>
  );
}
