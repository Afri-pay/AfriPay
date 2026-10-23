'use client';

import { use, useEffect, useState } from 'react';
import { NativeWallet } from '@/components/Wallet/NativeWallet';
import { apiFetch } from '@/lib/api';

export default function PaymentLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<{ creator: string; amount?: string; reference?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    apiFetch(`/payments/links/${encodeURIComponent(id)}`).then((response) => response.json()).then((link) => { if (active) setRequest(link); }).catch(() => { if (active) setError('This payment link is invalid, expired, or currently unavailable.'); });
    return () => { active = false; };
  }, [id]);
  return <main className="afri-content"><h1>AfriPay payment request · Testnet</h1>{error ? <p role="alert">{error}</p> : request ? <><p>Pay {request.amount ?? 'an amount you choose'} XLM to {request.creator}. Review the complete transaction before signing.</p><NativeWallet paymentRequest={request} /></> : <p role="status">Loading payment request...</p>}</main>;
}
