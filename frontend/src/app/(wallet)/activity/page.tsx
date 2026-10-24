'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/Panel';
import { ActivityList } from '@/components/wallet/ActivityList';
import { PendingPaymentNotice } from '@/components/wallet/PendingPaymentNotice';
import { usePendingPayment } from '@/components/wallet/usePendingPayment';
import { useWallet } from '@/components/wallet/WalletProvider';

export default function ActivityPage() {
  const { address, account, refreshAccount } = useWallet();
  const pending = usePendingPayment();
  return (
    <div>
      <PageHeader title="Activity" description="Your 50 most recent settled payments on Stellar Testnet."
        action={<Button size="sm" onClick={refreshAccount} disabled={account.loading}><Icon name="refresh" size={15} />{account.loading ? 'Refreshing…' : 'Refresh'}</Button>} />
      <div className="grid grid-cols-1 gap-4">
        <PendingPaymentNotice pending={pending} />
        <section className="rounded-lg border border-line bg-surface px-5 pb-2"><ActivityList items={account.history} address={address} /></section>
      </div>
    </div>
  );
}
