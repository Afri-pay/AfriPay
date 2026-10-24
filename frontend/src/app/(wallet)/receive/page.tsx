'use client';

import { PageHeader } from '@/components/ui/Panel';
import { AddressPanel, PaymentRequestPanel } from '@/components/wallet/ReceivePanel';

export default function ReceivePage() {
  return (
    <div>
      <PageHeader title="Receive" description="Share your address, or create a payment link with the amount filled in." />
      <div className="grid grid-cols-1 gap-5">
        <AddressPanel />
        <PaymentRequestPanel />
      </div>
    </div>
  );
}
