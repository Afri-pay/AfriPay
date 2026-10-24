'use client';

import { useState, type ReactNode } from 'react';
import { AddressText, CopyButton } from '@/components/ui/Address';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { ThemeSelect } from '@/components/ui/ThemeToggle';
import { RemoveWalletDialog } from '@/components/wallet/RemoveWalletDialog';
import { useWallet } from '@/components/wallet/WalletProvider';
import { getApiUrl } from '@/lib/api';

function Setting({ label, description, children }: { label: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <div className="mt-0.5 text-[13px] text-ink-2">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function apiEndpoint() {
  try { return getApiUrl(); } catch (error) { return error instanceof Error ? error.message : 'Not configured'; }
}

export default function SettingsPage() {
  const wallet = useWallet();
  const [removing, setRemoving] = useState(false);
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 gap-5">
        <Panel title="Wallet">
          {wallet.address && <Setting label="Address" description={<AddressText address={wallet.address} />}><CopyButton value={wallet.address} /></Setting>}
          <Setting label="Auto-lock" description="Your wallet locks after 15 minutes without activity, and whenever you close this tab." />
          <Setting label="Lock now" description="Remove the decrypted key from memory. You’ll need your password to unlock again.">
            <Button onClick={wallet.lock}><Icon name="lock" size={15} />Lock wallet</Button>
          </Setting>
        </Panel>

        <Panel title="Appearance">
          <Setting label="Theme" description="System follows your device setting."><ThemeSelect /></Setting>
        </Panel>

        <Panel title="Network">
          <Setting label="Stellar network" description="Testnet only. Balances and payments have no monetary value." />
          <Setting label="AfriPay API" description={<span className="break-all font-mono">{apiEndpoint()}</span>} />
        </Panel>

        <Panel title="Remove wallet">
          <Setting label="Remove from this device" description="Deletes the encrypted key from this browser. Make sure your secret key is backed up first.">
            <Button variant="danger" onClick={() => setRemoving(true)}><Icon name="trash" size={15} />Remove wallet</Button>
          </Setting>
        </Panel>
      </div>
      <RemoveWalletDialog open={removing} onClose={() => setRemoving(false)} />
    </div>
  );
}
