'use client';

import type { ReactNode } from 'react';
import { BackupSecret, Onboarding } from '@/components/onboarding/Onboarding';
import { Unlock } from '@/components/onboarding/Unlock';
import { NetworkBadge, Wordmark } from '@/components/ui/Brand';
import { Skeleton } from '@/components/ui/Panel';
import { useWallet } from './WalletProvider';

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8"><Wordmark /><NetworkBadge /></header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-[420px] rounded-lg border border-line bg-surface p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}

/**
 * Shows onboarding, backup or unlock until a wallet is open, then renders children.
 * `inline` renders the step without the full-page frame (used inside the payment-link checkout).
 */
export function WalletGate({ children, inline = false }: { children: ReactNode; inline?: boolean }) {
  const wallet = useWallet();
  let screen: ReactNode = null;
  if (!wallet.ready) screen = <div className="grid gap-3" aria-label="Loading wallet"><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="mt-4 h-11 w-full" /></div>;
  else if (wallet.setup.backupSecret) screen = <BackupSecret secret={wallet.setup.backupSecret} />;
  else if (wallet.setup.active || !wallet.encryptedWallet) screen = <Onboarding />;
  else if (!wallet.isUnlocked) screen = <Unlock />;
  if (!screen) return <>{children}</>;
  return inline ? <div className="rounded-lg border border-line bg-surface p-6">{screen}</div> : <AuthFrame>{screen}</AuthFrame>;
}
