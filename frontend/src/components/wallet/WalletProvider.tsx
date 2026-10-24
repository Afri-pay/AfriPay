'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNativeWallet } from '@/hooks/useNativeWallet';
import { apiFetch, getApiUrl } from '@/lib/api';

export type HistoryItem = { id: string; type: string; amount?: string; asset: string; transactionHash: string; createdAt: string; from?: string; to?: string };
export type AssetBalance = { asset: string; balance: string };

type AccountState = {
  loading: boolean;
  activated: boolean | null;
  xlm: string | null;
  assets: AssetBalance[];
  history: HistoryItem[] | null;
  error: string | null;
};

const emptyAccount: AccountState = { loading: false, activated: null, xlm: null, assets: [], history: null, error: null };

function readApiConfigError() {
  try { getApiUrl(); return null; } catch (error) { return error instanceof Error ? error.message : 'API URL is not configured.'; }
}

type WalletContextValue = ReturnType<typeof useNativeWallet> & {
  account: AccountState;
  refreshAccount: () => void;
  apiConfigError: string | null;
  /** Set while the create flow is running and until the secret key backup is acknowledged. */
  setup: { active: boolean; backupSecret: string | null };
  beginSetup: () => void;
  showBackup: (secret: string) => void;
  endSetup: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useNativeWallet();
  const [account, setAccount] = useState<AccountState>(emptyAccount);
  const [refreshToken, setRefreshToken] = useState(0);
  const [setup, setSetup] = useState<{ active: boolean; backupSecret: string | null }>({ active: false, backupSecret: null });
  const [apiConfigError] = useState(readApiConfigError);

  // Locking (manually or after inactivity) must drop any secret still on screen.
  useEffect(() => { if (!wallet.isUnlocked) setSetup((current) => (current.backupSecret ? { active: false, backupSecret: null } : current)); }, [wallet.isUnlocked]);

  useEffect(() => {
    const address = wallet.address;
    if (!address) { setAccount(emptyAccount); return; }
    let active = true;
    setAccount((current) => ({ ...current, loading: true, error: null }));
    apiFetch(`/stellar/accounts/${address}`).then((response) => response.json()).then((summary) => {
      if (!active) return;
      const balances: AssetBalance[] = summary.balances ?? [];
      setAccount((current) => ({ ...current, loading: false, activated: Boolean(summary.activated), xlm: balances.find((item) => item.asset === 'XLM')?.balance ?? '0', assets: balances.filter((item) => item.asset !== 'XLM') }));
    }).catch((error: unknown) => {
      if (active) setAccount((current) => ({ ...current, loading: false, activated: false, error: error instanceof Error ? error.message : 'Unable to load Testnet balance.' }));
    });
    apiFetch(`/stellar/accounts/${address}/history`).then((response) => response.json()).then((result) => {
      if (active) setAccount((current) => ({ ...current, history: result.records ?? [] }));
    }).catch(() => { if (active) setAccount((current) => ({ ...current, history: [] })); });
    return () => { active = false; };
  }, [wallet.address, refreshToken]);

  const refreshAccount = useCallback(() => setRefreshToken((value) => value + 1), []);
  const beginSetup = useCallback(() => setSetup({ active: true, backupSecret: null }), []);
  const showBackup = useCallback((secret: string) => setSetup({ active: true, backupSecret: secret }), []);
  const endSetup = useCallback(() => setSetup({ active: false, backupSecret: null }), []);

  const value = useMemo(() => ({ ...wallet, account, refreshAccount, apiConfigError, setup, beginSetup, showBackup, endSetup }), [wallet, account, refreshAccount, apiConfigError, setup, beginSetup, showBackup, endSetup]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used inside WalletProvider');
  return context;
}

export const pendingPaymentKey = (address: string) => `afripay.pending.${address}`;
