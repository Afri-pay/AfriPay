import { WalletConnect } from '@/components/Wallet/WalletConnect';
import { PaymentDashboard } from '@/components/Payments/PaymentDashboard';
import { ReceivePayment } from '@/components/Payments/ReceivePayment';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[#164f42] bg-[#0a5c4a] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2a900] text-lg font-black text-[#102a2a]" aria-hidden="true">A</div>
            <div>
              <p className="text-lg font-semibold tracking-tight">AfriPay</p>
              <p className="text-xs text-emerald-100">Cross-border payments, built for Africa</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-emerald-100 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#f2a900]" aria-hidden="true" />
            Stellar Testnet
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a5c4a]">Payment workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102a2a] sm:text-4xl">Move money with confidence.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Create, sign, and track XLM payments from one calm, transparent workspace.</p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
            <p className="font-semibold text-[#102a2a]">Development environment</p>
            <p className="mt-1 text-xs text-slate-500">Transactions settle on Stellar Testnet.</p>
          </div>
        </div>

        <div className="mb-6">
          <WalletConnect />
        </div>
        <PaymentDashboard />
        <div className="mt-6">
          <ReceivePayment />
        </div>
      </div>
    </main>
  );
}
