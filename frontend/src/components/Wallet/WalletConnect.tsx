'use client';

import { useFreighterWallet } from '@/hooks/useFreighterWallet';

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const { isInstalled, isChecking, address, error, connect, disconnect } =
    useFreighterWallet();

  if (isChecking) {
    return <p className="text-sm text-gray-500">Checking wallet...</p>;
  }

  if (!isInstalled) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Freighter wallet isn&apos;t installed. Install it to send and receive
          payments.
        </p>
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-amber-900 underline"
        >
          Get Freighter
        </a>
      </div>
    );
  }

  if (address) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 p-4">
        <span className="text-sm font-medium text-green-900">
          Connected: {truncateAddress(address)}
        </span>
        <button
          onClick={disconnect}
          className="text-sm font-medium text-green-900 underline"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        className="w-full rounded-lg bg-[var(--afripay-primary)] px-4 py-2 font-medium text-white"
      >
        Connect Wallet
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
