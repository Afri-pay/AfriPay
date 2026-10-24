import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NativeWallet } from './NativeWallet';
import { apiFetch } from '@/lib/api';
import { signTransactionXdr } from '@/lib/stellar';

const wallet = { ready: true, address: 'GTESTSENDER', secret: 'local-secret-for-isolated-test', encryptedWallet: { publicKey: 'GTESTSENDER' }, isUnlocked: true, lock: jest.fn(), remove: jest.fn() };
jest.mock('@/hooks/useNativeWallet', () => ({ useNativeWallet: () => wallet }));
jest.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.example.test', apiFetch: jest.fn() }));
jest.mock('@/lib/stellar', () => ({ signTransactionXdr: jest.fn(() => 'signed-test-envelope') }));
jest.mock('qrcode', () => ({ toDataURL: () => Promise.resolve('data:image/png;base64,AA==') }));

describe('native payment interaction', () => {
  beforeEach(() => {
    localStorage.clear(); jest.clearAllMocks();
    (apiFetch as jest.Mock).mockImplementation(async (path: string) => ({ json: async () => {
      if (path.endsWith('/history')) return { records: [] };
      if (path.startsWith('/stellar/accounts/')) return { activated: true, balances: [{ asset: 'XLM', balance: '100' }] };
      if (path === '/payments/intents') return { id: 'intent-1' };
      if (path.endsWith('/transaction')) return { xdr: 'unsigned-test-envelope', network: 'testnet', fee: '200' };
      if (path.endsWith('/submit')) return { status: 'PENDING', transactionHash: 'a'.repeat(64) };
      return { status: 'PENDING', transactionHash: 'a'.repeat(64) };
    } }));
  });
  it('requires review before signing and retains an uncertain payment for retry', async () => {
    render(<NativeWallet />);
    const send = await screen.findByRole('button', { name: /Send$/ });
    await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(send);
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: 'GTESTRECIPIENT' } });
    fireEvent.change(screen.getByLabelText('XLM amount'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Memo'), { target: { value: 'invoice' } });
    const review = screen.getByRole('button', { name: 'Review payment' });
    fireEvent.click(review); fireEvent.click(review);
    const confirm = await screen.findByRole('button', { name: 'Confirm & Sign' });
    expect(signTransactionXdr).not.toHaveBeenCalled();
    expect(screen.getByText(/Fee: 200 stroops/)).toBeTruthy();
    expect((apiFetch as jest.Mock).mock.calls.filter(([path]) => path === '/payments/intents')).toHaveLength(1);
    fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(screen.getByText(/Settlement unconfirmed/)).toBeTruthy());
    expect(signTransactionXdr).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('afripay.pending.GTESTSENDER')).toBe('intent-1');
    expect((apiFetch as jest.Mock).mock.calls.filter(([path]) => path.endsWith('/submit'))).toHaveLength(1);
    expect(JSON.stringify((apiFetch as jest.Mock).mock.calls)).not.toContain(wallet.secret);
  });
  it('provides a deliberate lock control', async () => {
    render(<NativeWallet />);
    fireEvent.click(await screen.findByRole('button', { name: 'Lock wallet' }));
    expect(wallet.lock).toHaveBeenCalledTimes(1);
  });
});
