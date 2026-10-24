'use client';

import { use, useEffect, useState } from 'react';
import { AddressText } from '@/components/ui/Address';
import { NetworkBadge, Wordmark } from '@/components/ui/Brand';
import { ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Panel';
import { SendFlow, type PaymentRequest } from '@/components/wallet/SendFlow';
import { WalletGate } from '@/components/wallet/WalletGate';
import { apiFetch } from '@/lib/api';
import { formatAmount } from '@/lib/format';

function RequestSummary({ request }: { request: PaymentRequest }) {
  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="border-b border-line p-5 sm:p-6">
        <p className="text-[13px] text-ink-2">Payment request</p>
        <p className="mt-1 text-[30px] font-semibold tracking-[-0.02em] tabular-nums">
          {request.amount ? <>{formatAmount(request.amount)} <span className="text-lg font-medium text-ink-2">XLM</span></> : 'Any amount'}
        </p>
      </div>
      <dl className="grid gap-3 p-5 text-sm sm:p-6">
        <div><dt className="text-[13px] text-ink-2">Pay to</dt><dd className="mt-0.5"><AddressText address={request.creator} /></dd></div>
        {request.reference && <div><dt className="text-[13px] text-ink-2">Reference</dt><dd className="mt-0.5">{request.reference}</dd></div>}
        {request.expiresAt && <div><dt className="text-[13px] text-ink-2">Expires</dt><dd className="mt-0.5">{new Date(request.expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>}
      </dl>
    </section>
  );
}

export default function PaymentLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    apiFetch(`/payments/links/${encodeURIComponent(id)}`).then((response) => response.json()).then((link) => { if (active) setRequest(link); }).catch(() => { if (active) setError('This payment link is invalid, expired, or currently unavailable.'); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8"><Wordmark /><NetworkBadge /></header>
      <main className="mx-auto grid w-full max-w-[480px] grid-cols-1 gap-4 px-4 pb-16 pt-4 sm:pt-10">
        <h1 className="sr-only">AfriPay payment request</h1>
        {error ? (
          <>
            <Notice tone="error" title="Payment link unavailable">{error} Ask the person who sent it for a new link.</Notice>
            <div><ButtonLink href="/">Go to AfriPay</ButtonLink></div>
          </>
        ) : !request ? (
          <div className="grid gap-3 rounded-lg border border-line bg-surface p-6" role="status" aria-label="Loading payment request">
            <Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-40" /><Skeleton className="mt-3 h-4 w-full" />
          </div>
        ) : (
          <>
            <RequestSummary request={request} />
            <WalletGate inline><SendFlow request={request} /></WalletGate>
            <p className="text-center text-[13px] text-ink-3">You’ll review the full transaction before anything is signed.</p>
          </>
        )}
      </main>
    </div>
  );
}
