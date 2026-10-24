'use client';

import { PageHeader } from '@/components/ui/Panel';
import { SendFlow } from '@/components/wallet/SendFlow';

export default function SendPage() {
  return (
    <div className="max-w-[560px]">
      <PageHeader title="Send XLM" description="Send Testnet XLM to any Stellar address. You’ll review the details and fee before signing." />
      <SendFlow />
    </div>
  );
}
