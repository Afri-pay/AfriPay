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

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
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
    <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Send payment</h2>
        <p className="mt-1 text-sm text-slate-600">Create a tracked payment intent on Stellar testnet.</p>
        <label className="mt-5 block text-sm font-medium text-slate-700">Recipient
          <input required value={recipient} onChange={(event) => setRecipient(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" placeholder="G..." />
        </label>
        <div className="mt-4 grid grid-cols-[1fr_100px] gap-3">
          <label className="text-sm font-medium text-slate-700">Amount
            <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" placeholder="10" />
          </label>
          <label className="text-sm font-medium text-slate-700">Asset
            <select value={asset} onChange={(event) => setAsset(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2"><option>XLM</option><option>USDC</option></select>
          </label>
        </div>
        <button disabled={sending} className="mt-5 w-full rounded bg-[var(--afripay-primary)] px-4 py-2 font-medium text-white disabled:opacity-60">{sending ? 'Creating...' : 'Create payment intent'}</button>
        {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
      </form>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Recent payments</h2>
        {intents.length === 0 ? <p className="mt-5 text-sm text-slate-500">No payment intents for this wallet yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{intents.map((intent) => <li key={intent.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium text-slate-900">{intent.amount} {intent.asset}</p><p className="text-xs text-slate-500">To {intent.recipient.slice(0, 6)}...{intent.recipient.slice(-4)}</p>{intent.transactionHash && <a className="text-xs text-emerald-700 underline" href={`https://stellar.expert/explorer/testnet/tx/${intent.transactionHash}`} target="_blank" rel="noreferrer">View on Stellar Expert</a>}<button type="button" onClick={() => setSelected(intent)} className="mt-1 block text-xs text-slate-700 underline">Details</button></div><span className="text-xs font-semibold text-amber-700">{intent.status}</span></li>)}</ul>}
        {selected && <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600"><p><strong>ID:</strong> {selected.id}</p><p><strong>Recipient:</strong> {selected.recipient}</p><p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleString()}</p></div>}
      </div>
    </section>
  );
}
