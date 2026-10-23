'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useNativeWallet } from '@/hooks/useNativeWallet';
import { signTransactionXdr } from '@/lib/stellar';
import { apiFetch, getApiUrl } from '@/lib/api';

const apiUrl = (() => { try { return getApiUrl(); } catch { return ''; } })();
const headers = (): Record<string, string> => ({});
const short = (value: string) => `${value.slice(0, 6)}...${value.slice(-5)}`;
type HistoryItem = { id: string; type: string; amount?: string; asset: string; transactionHash: string; createdAt: string; from?: string; to?: string };

export function NativeWallet({ paymentRequest }: { paymentRequest?: { creator: string; amount?: string; reference?: string } } = {}) {
  const wallet = useNativeWallet();
  const [mode, setMode] = useState<'home' | 'create' | 'import' | 'unlock' | 'backup' | 'dashboard' | 'receive' | 'send'>('home');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [rawSecret, setRawSecret] = useState('');
  const [backupSecret, setBackupSecret] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [assets, setAssets] = useState<Array<{ asset: string; balance: string }>>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activated, setActivated] = useState<boolean | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [accountRefreshToken, setAccountRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const sending = useRef(false);
  const pendingPayment = useRef<{ id: string; signedXdr: string } | null>(null);
  const [backedUp, setBackedUp] = useState(false);
  const [review, setReview] = useState<{ id: string; xdr: string; fee: string; recipient: string; amount: string; memo: string } | null>(null);

  useEffect(() => {
    const navigate = (event: Event) => {
      if (!wallet.isUnlocked) { setMessage('Unlock your wallet to use payment tools.'); return; }
      const target = (event as CustomEvent<string>).detail;
      setMode(target === 'send' ? 'send' : target === 'receive' || target === 'link' ? 'receive' : 'dashboard');
      if (target === 'assets' || target === 'activity') window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 0);
    };
    window.addEventListener('afripay:navigate', navigate);
    return () => window.removeEventListener('afripay:navigate', navigate);
  }, [wallet.isUnlocked]);

  useEffect(() => {
    if (paymentRequest && wallet.isUnlocked) { setRecipient(paymentRequest.creator); setAmount(paymentRequest.amount ?? ''); setMemo(paymentRequest.reference ?? ''); setMode('send'); }
  }, [paymentRequest, wallet.isUnlocked]);

  useEffect(() => {
    if (!wallet.isUnlocked) {
      setBackupSecret(null); setRawSecret(''); setReview(null); pendingPayment.current = null;
      if (mode === 'send' || mode === 'receive' || mode === 'backup') setMode(wallet.encryptedWallet ? 'unlock' : 'home');
    }
  }, [wallet.isUnlocked, wallet.encryptedWallet, mode]);

  useEffect(() => { if (wallet.ready && (mode === 'home' || mode === 'unlock')) setMode(wallet.encryptedWallet ? (wallet.isUnlocked ? 'dashboard' : 'unlock') : 'home'); if (wallet.ready && mode === 'dashboard' && !wallet.isUnlocked) setMode('unlock'); }, [wallet.ready, wallet.encryptedWallet, wallet.isUnlocked, mode]);
  useEffect(() => { if (!wallet.address) return; setActivated(null); apiFetch(`/stellar/accounts/${wallet.address}`, { headers: headers() }).then((response) => response.json()).then((summary) => { setActivated(Boolean(summary.activated)); setBalance(summary.balances.find((item: { asset: string }) => item.asset === 'XLM')?.balance ?? '0'); setAssets(summary.balances.filter((item: { asset: string }) => item.asset !== 'XLM')); }).catch((error: unknown) => { setActivated(false); setMessage(error instanceof Error ? error.message : 'Unable to load Testnet balance.'); }); apiFetch(`/stellar/accounts/${wallet.address}/history`, { headers: headers() }).then((response) => response.json()).then((result) => setHistory(result.records ?? [])).catch(() => setHistory([])); }, [wallet.address, accountRefreshToken]);
  useEffect(() => { if (wallet.address && (mode === 'receive' || mode === 'dashboard')) QRCode.toDataURL(`stellar:${wallet.address}`).then(setQr).catch(() => setQr(null)); }, [wallet.address, mode]);

  async function submitWallet(event: FormEvent) { event.preventDefault(); setMessage(null); if (password !== confirm) return setMessage('Passwords do not match.'); setBusy(true); try { const recoverySecret = mode === 'create' ? (await wallet.create(password)).secret : rawSecret.trim(); if (mode === 'import') await wallet.importWallet(rawSecret, password); setBackupSecret(recoverySecret); setMode('backup'); setPassword(''); setConfirm(''); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save wallet locally.'); } finally { setBusy(false); } }
  async function unlock(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(null); try { await wallet.unlock(password); setPassword(''); setMode('dashboard'); } catch { setMessage('Incorrect wallet password or corrupted wallet data.'); } finally { setBusy(false); } }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    if (!wallet.secret || !wallet.address) return setMessage('Unlock your wallet before signing.');
    if (!pendingPayment.current && window.localStorage.getItem(`afripay.pending.${wallet.address}`)) return setMessage('A prior payment is unresolved. Use Check pending payment before creating another payment.');
    sending.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if (!review && !pendingPayment.current) {
        const response = await apiFetch('/payments/intents', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID(), ...headers() }, body: JSON.stringify({ sender: wallet.address, recipient, amount, memo, asset: 'XLM' }) });
        const intent = await response.json();
        const prepared = await (await apiFetch(`/payments/intents/${intent.id}/transaction`, { method: 'POST', headers: headers() })).json();
        if (prepared.network !== 'testnet') throw new Error('Unexpected transaction network');
        setReview({ id: intent.id, xdr: prepared.xdr, fee: prepared.fee, recipient, amount, memo });
        return;
      }
      if (!pendingPayment.current && review) {
        const signedXdr = signTransactionXdr(wallet.secret, review.xdr, review);
        pendingPayment.current = { id: review.id, signedXdr };
        // Public metadata only. Recover status after refresh without storing signing material.
        window.localStorage.setItem(`afripay.pending.${wallet.address}`, review.id);
      }
      const pending = pendingPayment.current!;
      const result = await (await apiFetch(`/payments/intents/${pending.id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ signedXdr: pending.signedXdr }) })).json();
      if (result.status === 'PENDING') {
        setMessage(`Settlement unconfirmed (${result.transactionHash}). Check status or retry this same transaction; do not create another payment.`);
      } else {
        pendingPayment.current = null;
        window.localStorage.removeItem(`afripay.pending.${wallet.address}`);
        setReview(null);
        setMessage(result.status === 'SUCCEEDED' ? `Confirmed on Stellar Testnet: ${result.transactionHash}` : `Transaction failed on Stellar Testnet: ${result.transactionHash}`);
        setRecipient(''); setAmount(''); setMemo('');
        setAccountRefreshToken((value) => value + 1);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to verify payment. Check status before sending again.'); }
    finally { sending.current = false; setBusy(false); }
  }
  async function checkPending() {
    const id = wallet.address && window.localStorage.getItem(`afripay.pending.${wallet.address}`);
    if (!id) return setMessage('No pending payment recorded on this device.');
    setBusy(true);
    try {
      const result = await (await apiFetch(`/payments/intents/${id}`, { headers: headers() })).json();
      setMessage(`${result.status}: ${result.transactionHash ?? 'Awaiting submission'}`);
      if (result.status !== 'PENDING') {
        window.localStorage.removeItem(`afripay.pending.${wallet.address}`);
        pendingPayment.current = null; setReview(null);
        setAccountRefreshToken((value) => value + 1);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Status unavailable.'); }
    finally { setBusy(false); }
  }
  async function fundTestnet() { if (!wallet.address || busy) return; setBusy(true); setMessage('Funding Testnet account...'); try { await apiFetch(`/stellar/accounts/${wallet.address}/fund-testnet`, { method: 'POST', headers: headers() }); setMessage('Funding succeeded. Refreshing balance...'); window.setTimeout(() => setAccountRefreshToken((value) => value + 1), 4000); } catch (error) { setMessage(error instanceof Error ? error.message : 'Testnet funding failed.'); } finally { setBusy(false); } }
  async function createPaymentLink() { if (!wallet.address) return; if (!apiUrl) return setMessage('Production API URL is not configured. Set NEXT_PUBLIC_API_URL in Vercel.'); setBusy(true); try { const response = await fetch(`${apiUrl}/payments/links`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ creator: wallet.address, asset: 'XLM' }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message ?? 'Unable to create payment link'); setPaymentLink(result.url); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create payment link.'); } finally { setBusy(false); } }
  const copyAddress = () => { if (wallet.address) void navigator.clipboard.writeText(wallet.address); };

  if (!wallet.ready) return <section className="afri-card p-6">Loading wallet...</section>;
  if (mode === 'home') return <section className="afri-onboarding afri-card"><p className="afri-eyebrow">AfriPay Wallet</p><h2>Your Stellar wallet for payments.</h2><p>No registration required. Your keys stay encrypted on this device.</p><div className="afri-onboarding-actions"><button onClick={() => setMode('create')} className="afri-primary-btn">Create Wallet</button><button onClick={() => setMode('import')} className="afri-secondary-btn">Import Wallet</button></div></section>;
  if (mode === 'backup') return <section className="afri-backup afri-card"><p className="afri-eyebrow">One important step</p><h2>Back up your recovery secret</h2><p>Write this down and store it offline. Never share it or put it in a screenshot. AfriPay cannot recover it.</p><code>{backupSecret}</code><label><input type="checkbox" checked={backedUp} onChange={(event) => setBackedUp(event.target.checked)} required /> I have securely backed up my recovery secret.</label><button disabled={!backedUp} onClick={() => { setBackedUp(false); setBackupSecret(null); setRawSecret(''); setMode('dashboard'); }} className="afri-primary-btn">Continue to wallet</button></section>;
  if (mode === 'unlock') return <form onSubmit={unlock} className="afri-form afri-card"><p className="afri-eyebrow">AfriPay Wallet · Testnet</p><h2>Unlock Wallet</h2><p>{wallet.encryptedWallet && short(wallet.encryptedWallet.publicKey)}</p><input autoFocus required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Wallet password" /><button disabled={busy} className="afri-primary-btn">{busy ? 'Unlocking...' : 'Unlock Wallet'}</button>{message && <p role="alert" className="afri-error">{message}</p>}</form>;
  if (mode === 'create' || mode === 'import') return <form onSubmit={submitWallet} className="afri-form afri-card"><p className="afri-eyebrow">AfriPay Wallet · Testnet</p><h2>{mode === 'create' ? 'Create Wallet' : 'Import Wallet'}</h2>{mode === 'import' && <textarea required value={rawSecret} onChange={(e) => setRawSecret(e.target.value)} placeholder="Enter your Stellar secret key (S...)" />}{mode === 'create' && <p>A new Stellar keypair will be generated locally in your browser.</p>}<input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password (8+ characters)" /><input required type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" /><button disabled={busy} className="afri-primary-btn">{busy ? 'Encrypting locally...' : 'Continue'}</button>{message && <p role="alert" className="afri-error">{message}</p>}</form>;
  if (mode === 'receive') return <section className="afri-card afri-receive"><p className="afri-eyebrow">Receive payment</p><h2>Receive XLM</h2><p className="afri-address-full">{wallet.address}</p>{qr && <Image src={qr} alt="QR code for public Stellar address" width={224} height={224} className="afri-qr" />}<button onClick={copyAddress} className="afri-secondary-btn">Copy Address</button><button disabled={busy} onClick={createPaymentLink} className="afri-secondary-btn">Create payment link</button>{paymentLink && <p className="afri-link-result">{paymentLink}</p>}<button onClick={() => setMode('dashboard')} className="afri-back-btn">Back to wallet</button></section>;
  if (mode === 'send') return <form onSubmit={send} className="afri-form afri-card"><p className="afri-eyebrow">Send payment</p><h2>Send XLM · TESTNET</h2><input required aria-label="Recipient address" disabled={Boolean(review) || Boolean(pendingPayment.current)} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient G..." /><input required inputMode="decimal" aria-label="XLM amount" disabled={Boolean(review) || Boolean(pendingPayment.current)} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" /><input aria-label="Memo" disabled={Boolean(review) || Boolean(pendingPayment.current)} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo (optional)" /><p>Review: {amount || '0'} XLM to {recipient ? short(recipient) : 'recipient'} on Testnet. Signing happens locally.</p><button disabled={busy} className="afri-primary-btn">{busy ? 'Working...' : pendingPayment.current ? 'Retry same transaction' : review ? 'Confirm & Sign' : 'Review payment'}</button>{review && <p>Fee: {review.fee} stroops. Recipient: {review.recipient}. Amount: {review.amount} XLM. Memo: {review.memo || '(none)'}. Network: Stellar Testnet.</p>}{review && !pendingPayment.current && <button type="button" onClick={() => setReview(null)}>Edit payment</button>}<small>Network fee is fetched before review.</small>{message && <p role="status">{message}</p>}<button type="button" onClick={() => setMode('dashboard')} className="afri-back-btn">Back to wallet</button></form>;

  return <section className="afri-wallet-dashboard">{!apiUrl && <p role="alert" className="afri-api-warning">Production API URL is not configured. Set NEXT_PUBLIC_API_URL in Vercel and redeploy.</p>}
    <div className="afri-wallet-hero"><div className="afri-hero-copy"><div className="afri-card-title"><strong>AfriPay Wallet · Testnet</strong><span>▣</span></div><h2>{balance ?? '—'} XLM</h2><p className="afri-wallet-id">◉ &nbsp;{wallet.address && short(wallet.address)} <button onClick={copyAddress} aria-label="Copy wallet address">▣</button></p><p className="afri-funded">● &nbsp;{activated ? 'Account is active and funded' : activated === false ? 'Account not activated on Stellar yet' : 'Checking account status...'}</p></div><span className="afri-network afri-hero-network"><span />Stellar Testnet</span><div className="afri-africa-mark" aria-hidden="true" /></div>
    {activated === false && <div className="afri-funding-row"><p>Account not activated on Stellar yet.</p><button disabled={busy || !apiUrl} onClick={fundTestnet}>{busy ? 'Funding...' : 'Fund Testnet Account'}</button></div>}
    <div className="afri-quick-actions"><button onClick={() => setMode('send')} disabled={activated !== true || !apiUrl}><span>➤</span> Send</button><button onClick={() => setMode('receive')}><span>▦</span> Receive</button><button disabled title="Not available in this Testnet preview"><span>▣</span> Buy / Fund</button><button disabled title="Not available in this Testnet preview"><span>•••</span> More</button></div>
    <div className="afri-address-card"><div><h3>Wallet Address <button onClick={copyAddress} aria-label="Copy address">▣</button></h3><p>{wallet.address}</p><small>Only share this address to receive payments.</small></div>{qr ? <Image src={qr} alt="QR code for public Stellar address" width={92} height={92} className="afri-dashboard-qr" /> : <div className="afri-qr-placeholder">QR</div>}</div>
    <div className="afri-dashboard-grid"><div id="assets" className="afri-assets-card afri-card"><div className="afri-section-heading"><h3>Assets</h3></div><div className="afri-asset-row"><span className="afri-asset-icon xlm">✦</span><span><b>XLM</b><small>Stellar Lumens</small></span><strong>{balance ?? '0.0000000'}<small>Testnet assets have no monetary value</small></strong></div>{assets.length ? assets.map((asset) => <div className="afri-asset-row" key={asset.asset}><span className="afri-asset-icon usdc">$</span><span><b>{asset.asset}</b><small>Stellar asset</small></span><strong>{asset.balance}<small>Testnet</small></strong></div>) : <div className="afri-asset-row"><span className="afri-asset-icon usdc">$</span><span><b>USDC</b><small>USD Coin (Testnet)</small></span><strong>0.0000000<small>Testnet</small></strong></div>}</div><div className="afri-promo-card"><div><h3>Send money<br />across Africa</h3><p>Fast. Affordable.<br />Built for you.</p></div><div className="afri-promo-africa">◆</div></div></div>
    <div id="activity" className="afri-activity-card afri-card"><div className="afri-section-heading"><h3>Recent Activity</h3></div>{history.length === 0 ? <p className="afri-empty">No on-chain payments found.</p> : history.slice(0, 5).map((item) => <div className="afri-activity-row" key={item.id}><span className="afri-activity-icon">✦</span><span><b>{item.type}</b><small>{item.asset} payment</small></span><span className="afri-activity-status">Completed</span><strong>{item.amount ? `${item.amount} ${item.asset}` : '—'}<small>{new Date(item.createdAt).toLocaleString()}</small></strong><a href={`https://stellar.expert/explorer/testnet/tx/${item.transactionHash}`} target="_blank" rel="noreferrer">↗</a></div>)}</div>
    <div className="afri-footer-promo"><span>▣</span><div><b>Building the future of payments for Africa</b><small>Secure. Transparent. Open.</small></div><strong>• • AfriPay</strong></div>
    {message && <p role="status" className="afri-status-message">{message}</p>}<button onClick={wallet.lock} className="afri-secondary-btn">Lock wallet</button><button disabled={busy} onClick={checkPending} className="afri-secondary-btn">Check pending payment</button><button onClick={() => { if (window.confirm('Remove this encrypted wallet from this device? Verify your backup first.')) wallet.remove(); }} className="afri-remove-wallet">Remove wallet from device</button>
  </section>;
}
