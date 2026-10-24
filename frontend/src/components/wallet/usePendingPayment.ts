'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { pendingPaymentKey, useWallet } from './WalletProvider';

export type PendingOutcome = { status: string; transactionHash?: string } | { error: string };

/**
 * Tracks the one unresolved payment this device may have submitted. Only the public intent id is stored,
 * never signing material, so status can be recovered after a refresh.
 */
export function usePendingPayment() {
  const { address, refreshAccount } = useWallet();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<PendingOutcome | null>(null);

  const reload = useCallback(() => { setPendingId(address ? window.localStorage.getItem(pendingPaymentKey(address)) : null); }, [address]);
  useEffect(reload, [reload]);

  const check = useCallback(async (): Promise<PendingOutcome | null> => {
    const id = address && window.localStorage.getItem(pendingPaymentKey(address));
    if (!id) { setPendingId(null); setOutcome({ error: 'No pending payment is recorded on this device.' }); return null; }
    setChecking(true);
    try {
      const result = await (await apiFetch(`/payments/intents/${id}`)).json();
      const next = { status: String(result.status), transactionHash: result.transactionHash };
      if (next.status !== 'PENDING') {
        window.localStorage.removeItem(pendingPaymentKey(address));
        setPendingId(null);
        refreshAccount();
      }
      setOutcome(next);
      return next;
    } catch (error) {
      const next = { error: error instanceof Error ? error.message : 'Payment status is unavailable right now.' };
      setOutcome(next);
      return next;
    } finally { setChecking(false); }
  }, [address, refreshAccount]);

  return { pendingId, reload, check, checking, outcome, clearOutcome: () => setOutcome(null) };
}
