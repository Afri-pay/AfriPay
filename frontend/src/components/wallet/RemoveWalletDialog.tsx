'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useWallet } from './WalletProvider';

export function RemoveWalletDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const wallet = useWallet();
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => { if (!open) setAcknowledged(false); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} title="Remove wallet from this device?">
      <p className="text-sm text-ink-2">The encrypted key will be deleted from this browser. Your funds stay on Stellar, but you can only access them again with your secret key.</p>
      <label className="mt-4 flex items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--negative)]" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
        I have my secret key backed up.
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={!acknowledged} onClick={() => { wallet.remove(); onClose(); }}>Remove wallet</Button>
      </div>
    </Dialog>
  );
}
