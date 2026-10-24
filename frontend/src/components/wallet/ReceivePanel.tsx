'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { AddressText, CopyButton } from '@/components/ui/Address';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';
import { Panel, Skeleton } from '@/components/ui/Panel';
import { MEMO_MAX_BYTES, memoByteLength } from '@/lib/address';
import { apiFetch } from '@/lib/api';
import { useWallet } from './WalletProvider';

export function AddressPanel() {
  const { address } = useWallet();
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (!address) return;
    let active = true;
    QRCode.toDataURL(`stellar:${address}`, { margin: 0, width: 352 }).then((url) => { if (active) setQr(url); }).catch(() => { if (active) setQr(null); });
    return () => { active = false; };
  }, [address]);
  if (!address) return null;
  return (
    <Panel title="Your address">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        {/* QR stays dark-on-white in both themes so every scanner can read it. */}
        <div className="mx-auto rounded-md border border-line bg-white p-3">
          {qr ? <Image src={qr} alt="QR code of your Stellar address" width={176} height={176} unoptimized /> : <Skeleton className="size-44" />}
        </div>
        <div className="min-w-0">
          <AddressText address={address} className="text-sm" />
          <div className="mt-3"><CopyButton value={address} label="Copy address" /></div>
          <p className="mt-4 text-[13px] text-ink-2">Share this address to receive XLM or other Stellar Testnet assets from any Stellar wallet.</p>
        </div>
      </div>
    </Panel>
  );
}

type CreatedLink = { url: string; expiresAt?: string };

export function PaymentRequestPanel() {
  const { address, apiConfigError } = useWallet();
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [link, setLink] = useState<CreatedLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountError = amount && !/^\d{1,12}(\.\d{1,7})?$/.test(amount) ? 'Use a number with up to 7 decimal places.' : amount && Number(amount) <= 0 ? 'The amount must be more than zero.' : null;
  const referenceError = memoByteLength(reference) > MEMO_MAX_BYTES ? `References are limited to ${MEMO_MAX_BYTES} bytes.` : null;

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!address || amountError || referenceError) return;
    setBusy(true); setError(null);
    try {
      const response = await apiFetch('/payments/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creator: address, asset: 'XLM', amount: amount || undefined, reference: reference.trim() || undefined }) });
      setLink(await response.json());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create a payment link.'); }
    finally { setBusy(false); }
  }

  return (
    <Panel title="Request a payment" description="Create a link someone can open to pay you. It includes your address and, optionally, an amount and reference.">
      {link ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <input readOnly value={link.url} aria-label="Payment link" onFocus={(e) => e.target.select()} className="h-10 min-w-0 flex-1 rounded-md border border-line-strong bg-subtle px-3 font-mono text-[13px]" />
            <CopyButton value={link.url} className="h-10" />
          </div>
          {link.expiresAt && <p className="text-[13px] text-ink-2">Expires {new Date(link.expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.</p>}
          <div><Button size="sm" variant="ghost" onClick={() => { setLink(null); setAmount(''); setReference(''); }}>Create another link</Button></div>
        </div>
      ) : (
        <form onSubmit={create} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Amount" inputMode="decimal" placeholder="Any amount" suffix="XLM" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} error={amountError} />
            <TextField label="Reference" placeholder="Optional" value={reference} onChange={(e) => setReference(e.target.value)} error={referenceError} hint="Sent as the payment memo." />
          </div>
          {(error || apiConfigError) && <Notice tone="error">{error ?? apiConfigError}</Notice>}
          <div><Button type="submit" variant="primary" disabled={busy || Boolean(apiConfigError)}>{busy ? 'Creating…' : 'Create payment link'}</Button></div>
        </form>
      )}
    </Panel>
  );
}
