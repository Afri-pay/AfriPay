export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#0b5d4b" />
      <path d="M18 45 29 16h7l11 29h-7l-2.4-7H27.4L25 45h-7Zm12-13h5l-2.5-8L30 32Z" fill="#f2a900" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">AfriPay</span>
    </span>
  );
}

/** States the network plainly wherever money is shown, so Testnet balances are never mistaken for real funds. */
export function NetworkBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-warning-line bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning ${className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      Testnet
    </span>
  );
}
