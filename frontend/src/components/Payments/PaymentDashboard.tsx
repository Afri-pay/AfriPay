'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useFreighterWallet } from '@/hooks/useFreighterWallet';
import { signTransaction } from '@stellar/freighter-api';

type Intent = {
  id: string;
  recipient: string;
  amount: string;
  asset: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
  transactionHash?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';
const apiHeaders = (): Record<string, string> => process.env.NEXT_PUBLIC_API_KEY ? { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY } : {};
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export function PaymentDashboard() {
  const { address } = useFreighterWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [intents, setIntents] = useState<Intent[]>([]);
  const [selected, setSelected] = useState<Intent | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!address) return;
    fetch(`${apiUrl}/payments/intents?sender=${encodeURIComponent(address)}`, { headers: apiHeaders() })
      .then((response) => (response.ok ? response.json() : []))
      .then(setIntents)
      .catch(() => setMessage('Backend is unavailable. Start it to view payment history.'));
  }, [address]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address) {
      setMessage('Connect Freighter before creating a payment.');
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/payments/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID(), ...apiHeaders() },
        body: JSON.stringify({ sender: address, recipient, amount, asset }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Unable to create payment');
      const transactionResponse = await fetch(`${apiUrl}/payments/intents/${result.id}/transaction`, { method: 'POST', headers: apiHeaders() });
      if (!transactionResponse.ok) throw new Error('Payment intent created, but Stellar transaction preparation failed');
      const unsigned = await transactionResponse.json();
      const signedXdr = await signTransaction(unsigned.xdr, { networkPassphrase: TESTNET_PASSPHRASE });
      const submission = await fetch(`${apiUrl}/payments/intents/${result.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({ signedXdr }),
      });
      const settled = await submission.json();
      if (!submission.ok) throw new Error(settled.message ?? 'Stellar submission failed');
      setIntents((current) => [settled, ...current.filter((intent) => intent.id !== settled.id)]);
      setRecipient('');
      setAmount('');
      setMessage('Payment submitted to Stellar Testnet.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create payment');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={submit} className="rounded-lg border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a5c4a]">Send money</p>
            <h2 className="mt-1 text-xl font-bold text-[#102a2a]">New payment</h2>
          </div>
          <span className="rounded-full bg-[#fdf3d9] px-2.5 py-1 text-xs font-bold text-[#8a5b00]">XLM</span>
        </div>
        <p className="mt-2 text-sm leading-5 text-slate-600">Create a tracked payment, review the details in Freighter, and submit it to Testnet.</p>
        <label className="mt-6 block text-sm font-semibold text-slate-700">Recipient address
          <input required value={recipient} onChange={(event) => setRecipient(event.target.value)} className="mt-2 w-full rounded-md border bg-white px-3 py-2.5 font-mono text-sm placeholder:font-sans placeholder:text-slate-400" placeholder="G..." />
        </label>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_96px] gap-3">
          <label className="text-sm font-semibold text-slate-700">Amount
            <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-md border bg-white px-3 py-2.5 text-sm placeholder:text-slate-400" placeholder="10" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Asset
            <select value={asset} onChange={(event) => setAsset(event.target.value)} className="mt-2 w-full rounded-md border bg-white px-3 py-2.5 text-sm"><option>XLM</option><option>USDC</option></select>
          </label>
        </div>
        <button disabled={sending} className="mt-6 w-full rounded-md bg-[var(--afripay-primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#084b3d] disabled:cursor-wait disabled:opacity-60">{sending ? 'Preparing secure signature...' : 'Continue to Freighter'}</button>
        {message && <p role="status" className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{message}</p>}
      </form>
      <div className="rounded-lg border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a5c4a]">Activity</p>
            <h2 className="mt-1 text-xl font-bold text-[#102a2a]">Recent payments</h2>
          </div>
          <span className="text-xs text-slate-500">{intents.length} {intents.length === 1 ? 'payment' : 'payments'}</span>
        </div>
        {intents.length === 0 ? <div className="mt-6 rounded-md border border-dashed bg-slate-50 p-6 text-center"><p className="text-sm font-semibold text-slate-700">Your payment activity will appear here.</p><p className="mt-1 text-xs text-slate-500">Connect Freighter and send your first Testnet payment.</p></div> : <ul className="mt-5 divide-y divide-slate-100">{intents.map((intent) => <li key={intent.id} className="flex items-start justify-between gap-4 py-4 first:pt-0"><div className="min-w-0"><p className="font-semibold text-[#102a2a]">{intent.amount} {intent.asset}</p><p className="mt-1 truncate font-mono text-xs text-slate-500">To {intent.recipient.slice(0, 6)}...{intent.recipient.slice(-4)}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{intent.transactionHash && <a className="text-xs font-semibold text-[#0a5c4a] underline underline-offset-2" href={`https://stellar.expert/explorer/testnet/tx/${intent.transactionHash}`} target="_blank" rel="noreferrer">View on Stellar Expert</a>}<button type="button" onClick={() => setSelected(intent)} className="text-xs font-semibold text-slate-600 underline underline-offset-2">Details</button></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${intent.status === 'SUCCEEDED' ? 'bg-emerald-100 text-emerald-800' : intent.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-[#fdf3d9] text-[#8a5b00]'}`}>{intent.status}</span></li>)}</ul>}
        {selected && <div className="mt-4 border-t pt-4 text-xs leading-5 text-slate-600"><p><strong className="text-slate-800">Payment ID:</strong> {selected.id}</p><p><strong className="text-slate-800">Recipient:</strong> <span className="break-all font-mono">{selected.recipient}</span></p><p><strong className="text-slate-800">Created:</strong> {new Date(selected.createdAt).toLocaleString()}</p></div>}
      </div>
    </section>
  );
}
