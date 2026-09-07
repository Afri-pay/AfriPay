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

  return (
    <section className="border-t border-[#d9e7e1] pt-6">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a5c4a]">Get paid</p>
        <h2 className="mt-1 text-xl font-bold text-[#102a2a]">Create a receive link</h2>
        <p className="mt-1 text-sm text-slate-600">Request XLM from a customer with a simple shareable link.</p>
        <form onSubmit={createLink} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="receive-amount">Amount in XLM</label>
          <input id="receive-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-w-0 flex-1 rounded-md border bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400" placeholder="Optional amount in XLM" />
          <button className="rounded-md bg-[#102a2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a5c4a]">Create receive link</button>
        </form>
        {link && <p className="mt-3 break-all rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{link}</p>}
        {message && <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>}
      </div>
    </section>
  );
}
