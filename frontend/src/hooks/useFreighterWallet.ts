'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isConnected,
  isAllowed,
  setAllowed,
  getPublicKey,
} from '@stellar/freighter-api';

export type WalletState = {
  isInstalled: boolean;
  isChecking: boolean;
  address: string | null;
  error: string | null;
};

/**
 * Manages Freighter wallet connect/disconnect state for the frontend.
 * State lives only in React (no localStorage/sessionStorage), per project
 * constraints - the user reconnects each session.
 */
export function useFreighterWallet() {
  const [state, setState] = useState<WalletState>({
    isInstalled: false,
    isChecking: true,
    address: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkInstalled() {
      try {
        const connected = await isConnected();
        if (!cancelled) {
          setState((s) => ({ ...s, isInstalled: connected, isChecking: false }));
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, isInstalled: false, isChecking: false }));
        }
      }
    }

    checkInstalled();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
      }
      const address = await getPublicKey();
      if (!address) {
        setState((s) => ({ ...s, error: 'No address returned by Freighter' }));
        return;
      }
      setState((s) => ({ ...s, address }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no programmatic disconnect; we just clear local state.
    setState((s) => ({ ...s, address: null, error: null }));
  }, []);

  return { ...state, connect, disconnect };
}
