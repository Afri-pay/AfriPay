import { WalletConnect } from '@/components/Wallet/WalletConnect';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">AfriPay</h1>
      <p className="text-gray-600">
        Send money home instantly. No more waiting days or losing money to fees.
      </p>
      <WalletConnect />
    </main>
  );
}
