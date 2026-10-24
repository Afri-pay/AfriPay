'use client';

import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { explorerTxUrl, shortAddress } from '@/lib/format';
import type { usePendingPayment } from './usePendingPayment';

function TxLink({ hash }: { hash: string }) {
  return <a href={explorerTxUrl(hash)} target="_blank" rel="noreferrer" className="font-mono text-ink underline underline-offset-2">{shortAddress(hash)}</a>;
}

export function PendingPaymentNotice({ pending }: { pending: ReturnType<typeof usePendingPayment> }) {
  const { pendingId, outcome, check, checking } = pending;
  if (outcome && 'error' in outcome) return <Notice tone="error">{outcome.error}</Notice>;
  if (outcome && outcome.status === 'SUCCEEDED') return <Notice tone="success" title="Your previous payment was confirmed">{outcome.transactionHash && <>Transaction <TxLink hash={outcome.transactionHash} />.</>}</Notice>;
  if (outcome && outcome.status !== 'PENDING') return <Notice tone="error" title="Your previous payment did not settle">{outcome.transactionHash ? <>Transaction <TxLink hash={outcome.transactionHash} /> was not applied. You can send a new payment.</> : 'It was not submitted. You can send a new payment.'}</Notice>;
  if (!pendingId) return null;
  return (
    <Notice tone="warning" title="A previous payment hasn’t been confirmed yet"
      action={<Button size="sm" onClick={() => void check()} disabled={checking}>{checking ? 'Checking…' : 'Check status'}</Button>}>
      {outcome?.status === 'PENDING' ? 'Stellar hasn’t confirmed it yet. Check again in a moment.' : 'Check its status before sending another payment, so the same money isn’t sent twice.'}
    </Notice>
  );
}
