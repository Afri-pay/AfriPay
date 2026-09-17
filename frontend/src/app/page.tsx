import { NativeWallet } from '@/components/Wallet/NativeWallet';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navigation = [
  ['wallet', 'Wallet'], ['send', 'Send'], ['receive', 'Receive'], ['assets', 'Assets'], ['activity', 'Transactions'], ['link', 'Payment Links'], ['settings', 'Settings'],
] as const;

function Brand() {
  return <div className="flex items-center gap-3"><div className="brand-mark">A</div><div><p className="text-[17px] font-bold tracking-tight">AfriPay</p><p className="text-[11px] text-emerald-100/80">Cross-border payments, built for Africa</p></div></div>;
}

function NavItem({ item, mobile = false }: { item: typeof navigation[number]; mobile?: boolean }) {
  const [icon, label] = item;
  return <button type="button" className={`afri-nav-item ${icon === 'wallet' ? 'active' : ''} ${mobile ? 'mobile' : ''}`}><Icon name={icon} size={mobile ? 18 : 18} /><span>{label}</span></button>;
}

export default function HomePage() {
  return <main className="afri-shell min-h-screen">
    <header className="afri-topbar"><Brand /><div className="afri-top-actions"><span className="afri-network"><span />Stellar Testnet</span><ThemeToggle /><button className="afri-icon-action" aria-label="Notifications">♧<i /></button><button className="afri-profile" aria-label="Account menu">A <span>⌄</span></button></div></header>
    <div className="afri-layout">
      <aside className="afri-sidebar"><nav aria-label="Primary navigation">{navigation.map((item) => <NavItem key={item[1]} item={item} />)}</nav><div className="afri-faucet"><div className="afri-faucet-title"><span>♟</span> Testnet Faucet</div><p>Get free XLM for testing</p><button>Get Test XLM <span>→</span></button></div><div className="afri-sidebar-footer"><p>ⓘ &nbsp; Need help?</p><p>▣ &nbsp; Documentation</p><p>◌ &nbsp; Support</p></div></aside>
      <section className="afri-content"><div className="afri-content-inner"><div className="afri-welcome"><div><p className="afri-eyebrow">Payment workspace</p><h1>Welcome back to AfriPay <span aria-hidden="true">👋</span></h1><p>Move money with confidence. Create, sign, and track XLM<br className="hidden sm:block" /> payments from one calm, transparent workspace.</p></div><div className="afri-environment"><span className="afri-cube">◇</span><div><strong>Development environment</strong><small>Transactions settle on Stellar Testnet.</small></div></div></div><NativeWallet /></div></section>
    </div>
    <nav className="afri-mobile-nav" aria-label="Mobile navigation">{navigation.slice(0, 5).map((item) => <NavItem key={item[1]} item={item} mobile />)}</nav>
  </main>;
}
