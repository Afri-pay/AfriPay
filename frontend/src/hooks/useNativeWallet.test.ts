import { act, renderHook } from '@testing-library/react';
import { useNativeWallet } from './useNativeWallet';
import { WALLET_STORAGE_KEY } from '@/lib/wallet';

describe('wallet lifecycle', () => {
  beforeEach(() => localStorage.clear());
  it('creates, locks, restores, and removes a local wallet', async () => {
    const { result } = renderHook(() => useNativeWallet());
    let publicKey: string;
    await act(async () => { publicKey = (await result.current.create('test password long enough')).publicKey; });
    expect(result.current.isUnlocked).toBe(true);
    act(() => result.current.lock());
    expect(result.current.secret).toBeNull();
    await act(async () => { await expect(result.current.unlock('incorrect password')).rejects.toBeTruthy(); });
    expect(result.current.isUnlocked).toBe(false);
    await act(async () => { await result.current.unlock('test password long enough'); });
    expect(result.current.address).toBe(publicKey!);
    act(() => result.current.remove());
    expect(result.current.secret).toBeNull();
    expect(localStorage.getItem(WALLET_STORAGE_KEY)).toBeNull();
  });
});
