import { NativeWallet } from '@/components/Wallet/NativeWallet';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navigation = [
  ['wallet', 'Wallet'], ['send', 'Send'], ['receive', 'Receive'], ['assets', 'Assets'], ['activity', 'Transactions'], ['link', 'Payment Links'], ['settings', 'Settings'],
] as const;

function Brand() {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--afripay-accent)] text-xl font-black text-[#15302c] shadow-sm">A</div><div><p className="text-[17px] font-bold tracking-tight">AfriPay</p><p className="text-[11px] text-emerald-100/80">Cross-border payments, built for Africa</p></div></div>;
}

function NavItem({ item, mobile = false }: { item: typeof navigation[number]; mobile?: boolean }) {
  const [icon, label] = item;
  return <button type="button" className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${icon === 'wallet' ? 'bg-[var(--afripay-surface-soft)] text-[var(--afripay-primary)]' : 'text-[var(--afripay-muted)] hover:bg-[var(--afripay-surface-soft)] hover:text-[var(--afripay-ink)]'} ${mobile ? 'flex-1 flex-col gap-1 px-1 py-2 text-[10px]' : ''}`}><Icon name={icon} size={mobile ? 18 : 18} /><span>{label}</span></button>;
}

export default function HomePage() {
  return <main className="min-h-screen bg-[var(--afripay-mist)] text-[var(--afripay-ink)]">
    <header className="sticky top-0 z-20 border-b border-emerald-900/30 bg-[#075b4b] text-white shadow-sm"><div className="flex h-[68px] items-center justify-between px-5 lg:px-8"><Brand /><div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-950/20 px-3 py-2 text-xs font-semibold text-emerald-50 sm:flex"><span className="h-2 w-2 rounded-full bg-[#35d39c]" />Stellar Testnet</span><ThemeToggle /><button type="button" className="hidden rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold sm:block" aria-label="Wallet menu">A <span className="ml-2 text-xs">⌄</span></button></div></div></header>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className="relative hidden min-h-[calc(100vh-68px)] w-60 shrink-0 border-r border-[var(--afripay-line)] bg-[var(--afripay-surface)] px-4 py-5 lg:block"><nav className="space-y-1" aria-label="Primary navigation">{navigation.map((item) => <NavItem key={item[1]} item={item} />)}</nav><div className="mt-10 rounded-2xl bg-[var(--afripay-surface-soft)] p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><span className="text-lg">💡</span> Testnet Faucet</div><p className="text-xs leading-5 text-[var(--afripay-muted)]">Get free XLM for testing your wallet.</p><button type="button" className="mt-3 w-full rounded-lg bg-[var(--afripay-primary)] px-3 py-2 text-xs font-bold text-white">Get Test XLM <span className="ml-1">→</span></button></div><div className="absolute bottom-6 space-y-3 px-3 text-xs text-[var(--afripay-muted)]"><p>ⓘ &nbsp; Need help?</p><p>▣ &nbsp; Documentation</p><p>◌ &nbsp; Support</p></div></aside>
      <section className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:py-9 lg:pb-10"><div className="mx-auto max-w-5xl"><div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.19em] text-[var(--afripay-primary)]">Payment workspace</p><h1 className="mt-2 text-[28px] font-bold tracking-[-.03em] sm:text-4xl">Welcome back to AfriPay <span aria-hidden="true">👋</span></h1><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--afripay-muted)]">Move money with confidence. Create, sign and track Stellar payments from one calm, transparent workspace.</p></div><div className="premium-card flex items-center gap-3 px-4 py-3"><span className="rounded-xl bg-[var(--afripay-surface-soft)] p-2 text-[var(--afripay-primary)]"><Icon name="system" size={19} /></span><div><p className="text-xs font-bold">Development environment</p><p className="mt-1 text-[11px] text-[var(--afripay-muted)]">Transactions settle on Stellar Testnet.</p></div></div></div><NativeWallet /></div></section>
    </div>
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--afripay-line)] bg-[var(--afripay-surface)]/95 px-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">{navigation.slice(0, 5).map((item) => <NavItem key={item[1]} item={item} mobile />)}</nav>
  </main>;
}
