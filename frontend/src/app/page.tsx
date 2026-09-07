import { WalletConnect } from '@/components/Wallet/WalletConnect';
import { PaymentDashboard } from '@/components/Payments/PaymentDashboard';
import { ReceivePayment } from '@/components/Payments/ReceivePayment';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">AfriPay</h1>
        <p className="mt-2 text-slate-600">Stellar payments for African payment rails.</p>
      </div>
      <p className="text-gray-600">
        Testnet payment workspace
      </p>
      <WalletConnect />
      <PaymentDashboard />
      <ReceivePayment />
    </main>
  );
}
