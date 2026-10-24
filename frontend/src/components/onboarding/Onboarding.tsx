'use client';

import { useState, type FormEvent } from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { Button } from '@/components/ui/Button';
import { PasswordField, TextAreaField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/Notice';

type Step = 'welcome' | 'create' | 'import';

function StepHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-2 text-[13px] font-medium text-ink-2">{eyebrow}</p>}
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{title}</h1>
      {children && <p className="mt-2 text-sm text-ink-2">{children}</p>}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="-ml-1 mb-5 inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink">
      <Icon name="chevron-left" size={16} />Back
    </button>
  );
}

function PasswordPair({ password, confirm, onPassword, onConfirm, mismatch }: { password: string; confirm: string; onPassword: (v: string) => void; onConfirm: (v: string) => void; mismatch: boolean }) {
  return (
    <>
      <PasswordField label="Password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => onPassword(e.target.value)}
        hint="At least 8 characters. It encrypts your key on this device and can't be reset." />
      <PasswordField label="Confirm password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => onConfirm(e.target.value)}
        error={mismatch ? 'Passwords don’t match.' : null} />
    </>
  );
}

export function Onboarding() {
  const wallet = useWallet();
  const [step, setStep] = useState<Step>('welcome');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secret, setSecret] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mismatch = submitted && confirm.length > 0 && password !== confirm;

  function go(next: Step) { setStep(next); setPassword(''); setConfirm(''); setSecret(''); setSubmitted(false); setError(null); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true); setError(null);
    if (password !== confirm) return;
    setBusy(true);
    try {
      if (step === 'create') {
        wallet.beginSetup();
        const pair = await wallet.create(password);
        wallet.showBackup(pair.secret);
      } else {
        await wallet.importWallet(secret, password);
      }
      setPassword(''); setConfirm(''); setSecret('');
    } catch (cause) {
      wallet.endSetup();
      setError(cause instanceof Error ? cause.message : 'Unable to save wallet on this device.');
    } finally { setBusy(false); }
  }

  if (step === 'welcome') return (
    <div>
      <StepHeading title="A Stellar wallet that stays on your device">
        Your key is generated and encrypted in this browser. AfriPay’s servers only ever see your public address and signed transactions.
      </StepHeading>
      <div className="grid gap-2.5">
        <Button variant="primary" size="lg" onClick={() => go('create')}>Create a new wallet</Button>
        <Button size="lg" onClick={() => go('import')}>Import an existing secret key</Button>
      </div>
      <p className="mt-6 border-t border-line pt-4 text-[13px] text-ink-2">No account or registration. Funds on Stellar Testnet have no monetary value.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <BackLink onClick={() => go('welcome')} />
        {step === 'create'
          ? <StepHeading eyebrow="Step 1 of 2" title="Set a password">A new Stellar keypair will be created locally and encrypted with this password.</StepHeading>
          : <StepHeading title="Import a secret key">Paste the secret key that starts with S. It’s encrypted on this device and never sent anywhere.</StepHeading>}
      </div>
      {step === 'import' && <TextAreaField label="Secret key" required value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="S…" autoComplete="off" spellCheck={false} />}
      <PasswordPair password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} mismatch={mismatch} />
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-1">
        {busy ? 'Encrypting…' : step === 'create' ? 'Create wallet' : 'Import wallet'}
      </Button>
    </form>
  );
}

export function BackupSecret({ secret }: { secret: string }) {
  const wallet = useWallet();
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div>
      <StepHeading eyebrow="Step 2 of 2" title="Save your secret key">
        This key is the only way to recover your wallet. Write it down and keep it offline. Anyone who has it controls your funds.
      </StepHeading>
      <div className="relative rounded-md border border-line-strong bg-subtle p-4">
        <code className={`block break-all font-mono text-sm leading-6 transition-[filter] ${revealed ? '' : 'select-none blur-[6px]'}`}>{secret}</code>
        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="sm" onClick={() => setRevealed(true)}><Icon name="eye" size={15} />Reveal secret key</Button>
          </div>
        )}
      </div>
      <ul className="mt-4 grid gap-1.5 text-[13px] text-ink-2">
        <li>Don’t store it in screenshots, email or chat.</li>
        <li>AfriPay can’t recover it or reset your password.</li>
      </ul>
      <label className="mt-5 flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={!revealed} />
        I’ve written down my secret key and stored it somewhere safe.
      </label>
      <Button variant="primary" size="lg" className="mt-5 w-full" disabled={!confirmed} onClick={wallet.endSetup}>Continue to wallet</Button>
    </div>
  );
}
