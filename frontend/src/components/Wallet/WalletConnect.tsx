'use client';

import { useFreighterWallet } from '@/hooks/useFreighterWallet';

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const { isInstalled, isChecking, address, error, connect, disconnect } =
    useFreighterWallet();

  if (isChecking) {
    return <div className="rounded-lg border bg-white p-4 text-sm text-slate-600 shadow-sm">Checking Freighter connection...</div>;
  }

  if (!isInstalled) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-900">
          Freighter wallet isn&apos;t installed. Install it to send and receive
          payments.
        </p>
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#102a2a] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0a5c4a]"
        >
          Get Freighter
        </a>
      </div>
    );
  }

  if (address) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Wallet connected</p>
          <p className="mt-1 text-sm font-semibold text-emerald-950">{truncateAddress(address)}</p>
        </div>
        <button
          onClick={disconnect}
          className="self-start rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 sm:self-auto"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[#102a2a]">Connect your Freighter wallet</p>
          <p className="mt-1 text-sm text-slate-500">Use a funded Stellar Testnet account to sign payments.</p>
        </div>
        <button
          onClick={connect}
          className="rounded-md bg-[var(--afripay-primary)] px-4 py-2.5 font-semibold text-white transition hover:bg-[#084b3d] disabled:opacity-60"
        >
          Connect Wallet
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
