'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
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

const initialState: WalletState = {
  isInstalled: false,
  isChecking: true,
  address: null,
  error: null,
};

let walletState = initialState;
const listeners = new Set<() => void>();
let installationCheckStarted = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return walletState;
}

function updateState(update: (current: WalletState) => WalletState) {
  walletState = update(walletState);
  listeners.forEach((listener) => listener());
}

export function useFreighterWallet() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initialState);

  useEffect(() => {
    if (installationCheckStarted) return;
    installationCheckStarted = true;
    let cancelled = false;

    async function checkInstalled() {
      try {
        const connected = await isConnected();
        if (!cancelled) {
          updateState((s) => ({ ...s, isInstalled: connected, isChecking: false }));
        }
      } catch {
        if (!cancelled) {
          updateState((s) => ({ ...s, isInstalled: false, isChecking: false }));
        }
      }
    }

    checkInstalled();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    updateState((s) => ({ ...s, error: null }));
    try {
      const allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
      }
      const address = await getPublicKey();
      if (!address) {
        updateState((s) => ({ ...s, error: 'No address returned by Freighter' }));
        return;
      }
      updateState((s) => ({ ...s, address }));
    } catch (err) {
      updateState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no programmatic disconnect; we just clear local state.
    updateState((s) => ({ ...s, address: null, error: null }));
  }, []);

  return { ...state, connect, disconnect };
}
