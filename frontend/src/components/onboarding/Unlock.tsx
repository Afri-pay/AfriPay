'use client';

import { useState, type FormEvent } from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';
import { RemoveWalletDialog } from '@/components/wallet/RemoveWalletDialog';
import { shortAddress } from '@/lib/format';

export function Unlock() {
  const wallet = useWallet();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    try { await wallet.unlock(password); setPassword(''); }
    catch { setError('That password didn’t work. Check it and try again.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={unlock} className="grid gap-4">
      <div className="mb-2">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Unlock your wallet</h1>
        {wallet.encryptedWallet && <p className="mt-2 font-mono text-[13px] text-ink-2">{shortAddress(wallet.encryptedWallet.publicKey)}</p>}
      </div>
      <PasswordField label="Password" autoFocus required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" variant="primary" size="lg" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock'}</Button>
      <div className="border-t border-line pt-4 text-[13px] text-ink-2">
        {forgot ? (
          <>
            <p>Passwords can’t be reset. To get back in, remove this wallet from the device and import it again with your secret key.</p>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setRemoving(true)}>Remove wallet from this device</Button>
          </>
        ) : <button type="button" onClick={() => setForgot(true)} className="font-medium text-ink-2 underline underline-offset-2 hover:text-ink">Forgot your password?</button>}
      </div>
      <RemoveWalletDialog open={removing} onClose={() => setRemoving(false)} />
    </form>
  );
}
