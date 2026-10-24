'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { NetworkBadge, Wordmark } from '@/components/ui/Brand';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WalletGate } from '@/components/wallet/WalletGate';
import { useWallet } from '@/components/wallet/WalletProvider';
import { shortAddress } from '@/lib/format';

const navigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: '/', label: 'Overview', icon: 'home' },
  { href: '/send', label: 'Send', icon: 'send' },
  { href: '/receive', label: 'Receive', icon: 'receive' },
  { href: '/activity', label: 'Activity', icon: 'activity' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

function useActive() {
  const pathname = usePathname() ?? '/';
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
}

function Sidebar() {
  const wallet = useWallet();
  const isActive = useActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-5"><Link href="/" aria-label="AfriPay overview"><Wordmark /></Link></div>
      <nav aria-label="Primary" className="grid gap-0.5 px-3 pt-2">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
              className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors ${active ? 'bg-subtle font-medium text-ink' : 'text-ink-2 hover:bg-subtle hover:text-ink'}`}>
              <Icon name={item.icon} size={18} className={active ? 'text-primary' : ''} />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-line p-3">
        <div className="flex items-center justify-between px-2 pb-2"><NetworkBadge /><ThemeToggle /></div>
        <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
          <span className="truncate font-mono text-[13px] text-ink-2">{wallet.address && shortAddress(wallet.address)}</span>
          <button type="button" onClick={wallet.lock} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-ink-2 hover:bg-subtle hover:text-ink">
            <Icon name="lock" size={15} />Lock
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileBar() {
  const wallet = useWallet();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
      <Link href="/" aria-label="AfriPay overview"><Wordmark /></Link>
      <div className="flex items-center gap-1">
        <NetworkBadge className="mr-1" />
        <button type="button" onClick={wallet.lock} aria-label="Lock wallet" className="inline-flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-subtle hover:text-ink"><Icon name="lock" size={18} /></button>
      </div>
    </header>
  );
}

function TabBar() {
  const isActive = useActive();
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {navigation.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
            className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? 'text-primary' : 'text-ink-3'}`}>
            <Icon name={item.icon} size={20} />{item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletGate>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileBar />
          <main className="mx-auto w-full min-w-0 max-w-[880px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>
        </div>
      </div>
      <TabBar />
    </WalletGate>
  );
}
