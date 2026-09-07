'use client';

import { FormEvent, useState } from 'react';
import { useFreighterWallet } from '@/hooks/useFreighterWallet';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function ReceivePayment() {
  const { address } = useFreighterWallet();
  const [amount, setAmount] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function createLink(event: FormEvent) {
    event.preventDefault();
    if (!address) return setMessage('Connect Freighter before creating a receive link.');
    const response = await fetch(`${apiUrl}/payments/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator: address, amount: amount || undefined, asset: 'XLM' }),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message ?? 'Unable to create payment link');
    setLink(result.url);
    setMessage('Share this testnet payment link with the payer.');
  }

  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Receive payment</h2><p className="mt-1 text-sm text-slate-600">Create a shareable XLM payment request.</p><form onSubmit={createLink} className="mt-4 flex gap-3"><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2" placeholder="Optional amount" /><button className="rounded bg-slate-900 px-4 py-2 font-medium text-white">Create link</button></form>{link && <p className="mt-3 break-all text-sm text-emerald-700">{link}</p>}{message && <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>}</section>;
}
