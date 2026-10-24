'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CopyButton } from '@/components/ui/Address';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Notice } from '@/components/ui/Notice';
import { Panel, Skeleton } from '@/components/ui/Panel';
import { ActivityList } from '@/components/wallet/ActivityList';
import { useWallet } from '@/components/wallet/WalletProvider';
import { apiFetch } from '@/lib/api';
import { formatAmount } from '@/lib/format';

function FundNotice() {
  const { address, refreshAccount, apiConfigError } = useWallet();
  const [state, setState] = useState<'idle' | 'funding' | 'funded'>('idle');
  const [error, setError] = useState<string | null>(null);
  async function fund() {
    if (!address) return;
    setState('funding'); setError(null);
    try {
      await apiFetch(`/stellar/accounts/${address}/fund-testnet`, { method: 'POST' });
      setState('funded');
      // Horizon can take a few seconds to reflect the new account.
      window.setTimeout(refreshAccount, 4000);
    } catch (cause) { setState('idle'); setError(cause instanceof Error ? cause.message : 'Testnet funding failed.'); }
  }
  if (state === 'funded') return <Notice tone="success" title="Funding requested">Friendbot is funding your account. Your balance will update in a few seconds.</Notice>;
  return (
    <Notice tone="warning" title="This account isn’t active on Stellar yet"
      action={<Button size="sm" onClick={fund} disabled={state === 'funding' || Boolean(apiConfigError)}>{state === 'funding' ? 'Requesting…' : 'Fund with Testnet XLM'}</Button>}>
      Stellar accounts need a minimum balance before they can send or hold assets. On Testnet, Friendbot provides it for free.
      {error && <span className="mt-1 block text-negative">{error}</span>}
    </Notice>
  );
}

export default function OverviewPage() {
  const { address, account, refreshAccount, apiConfigError } = useWallet();
  const loadingBalance = account.xlm === null && !account.error;
  const nativeRow = account.activated ? [{ asset: 'XLM', balance: account.xlm ?? '0', name: 'Stellar Lumens' }] : [];
  const assets = [...nativeRow, ...account.assets.map((item) => ({ ...item, name: 'Issued asset' }))];

  return (
    <div className="grid grid-cols-1 gap-5">
      <h1 className="sr-only">Overview</h1>
      {apiConfigError && <Notice tone="error" title="API not configured">{apiConfigError}</Notice>}
      {account.error && <Notice tone="error" title="Couldn’t load your account" action={<Button size="sm" onClick={refreshAccount}>Try again</Button>}>{account.error}</Notice>}
      {account.activated === false && !account.error && <FundNotice />}

      <section className="rounded-lg border border-line bg-surface">
        <div className="flex flex-wrap items-end justify-between gap-5 p-5 sm:p-6">
          <div>
            <p className="text-[13px] text-ink-2">Balance</p>
            {loadingBalance
              ? <Skeleton className="mt-2 h-9 w-48" />
              : <p className="mt-1 text-[34px] font-semibold leading-tight tracking-[-0.02em] tabular-nums">{formatAmount(account.xlm)} <span className="text-lg font-medium tracking-normal text-ink-2">XLM</span></p>}
            <p className="mt-1 text-[13px] text-ink-3">Stellar Testnet · no monetary value</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <ButtonLink href="/send" variant="primary" className="flex-1 sm:flex-none"><Icon name="send" size={16} />Send</ButtonLink>
            <ButtonLink href="/receive" className="flex-1 sm:flex-none"><Icon name="receive" size={16} />Receive</ButtonLink>
          </div>
        </div>
        {address && (
          <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3.5 sm:px-6">
            <div className="min-w-0">
              <p className="text-[13px] text-ink-2">Your address</p>
              <p className="truncate font-mono text-[13px]">{address}</p>
            </div>
            <CopyButton value={address} />
          </div>
        )}
      </section>

      <Panel title="Assets" padded={false}>
        {loadingBalance ? <div className="grid gap-3 p-5"><Skeleton className="h-9 w-full" /></div>
          : assets.length === 0 ? <p className="px-5 py-6 text-[13px] text-ink-2">No assets yet. Fund the account to receive your first XLM.</p>
          : (
            <ul className="divide-y divide-line">
              {assets.map((item) => (
                <li key={item.asset} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-xs font-semibold text-ink-2">{item.asset.split(':')[0].slice(0, 4)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.asset.split(':')[0]}</p>
                    <p className="text-[13px] text-ink-3">{item.name}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatAmount(item.balance)}</p>
                </li>
              ))}
            </ul>
          )}
      </Panel>

      <Panel title="Recent activity" action={<Link href="/activity" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline">View all<Icon name="chevron-right" size={15} /></Link>}>
        <div className="-mt-3 -mb-2"><ActivityList items={account.history} address={address} limit={5} /></div>
      </Panel>
    </div>
  );
}
