import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Keypair } from '@stellar/stellar-sdk';
import SettingsPage from '@/app/(wallet)/settings/page';
import { SendFlow } from './SendFlow';
import { WalletProvider } from './WalletProvider';
import { apiFetch } from '@/lib/api';
import { signTransactionXdr } from '@/lib/stellar';

const wallet = { ready: true, address: 'GTESTSENDER', secret: 'local-secret-for-isolated-test', encryptedWallet: { publicKey: 'GTESTSENDER' }, isUnlocked: true, lock: jest.fn(), remove: jest.fn() };
jest.mock('@/hooks/useNativeWallet', () => ({ useNativeWallet: () => wallet }));
jest.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.example.test', apiFetch: jest.fn() }));
jest.mock('@/lib/stellar', () => ({ signTransactionXdr: jest.fn(() => 'signed-test-envelope') }));

const recipient = Keypair.random().publicKey();
const withWallet = (ui: React.ReactElement) => render(<WalletProvider>{ui}</WalletProvider>);

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
    withWallet(<SendFlow />);
    await screen.findByText(/Balance/);
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: recipient } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Memo'), { target: { value: 'invoice' } });
    const review = screen.getByRole('button', { name: 'Review payment' });
    fireEvent.click(review); fireEvent.click(review);
    const confirm = await screen.findByRole('button', { name: 'Confirm and sign' });
    expect(signTransactionXdr).not.toHaveBeenCalled();
    expect(screen.getByText(/200 stroops/)).toBeTruthy();
    expect((apiFetch as jest.Mock).mock.calls.filter(([path]) => path === '/payments/intents')).toHaveLength(1);
    fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(screen.getByText(/Settlement unconfirmed/)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Retry same transaction' })).toBeTruthy();
    expect(signTransactionXdr).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('afripay.pending.GTESTSENDER')).toBe('intent-1');
    expect((apiFetch as jest.Mock).mock.calls.filter(([path]) => path.endsWith('/submit'))).toHaveLength(1);
    expect(JSON.stringify((apiFetch as jest.Mock).mock.calls)).not.toContain(wallet.secret);
  });

  it('rejects an invalid recipient before creating a payment intent', async () => {
    withWallet(<SendFlow />);
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: 'GNOTANADDRESS' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review payment' }));
    expect(await screen.findByText(/isn’t a valid Stellar address/)).toBeTruthy();
    expect((apiFetch as jest.Mock).mock.calls.filter(([path]) => path === '/payments/intents')).toHaveLength(0);
  });

  it('blocks a new payment while an earlier one is unresolved', async () => {
    localStorage.setItem('afripay.pending.GTESTSENDER', 'intent-0');
    withWallet(<SendFlow />);
    expect(await screen.findByText(/previous payment hasn’t been confirmed/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: recipient } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review payment' }));
    expect(await screen.findByText(/Resolve the unconfirmed payment/)).toBeTruthy();
    expect((apiFetch as jest.Mock).mock.calls.filter(([path]) => path === '/payments/intents')).toHaveLength(0);
  });

  it('pays a payment link to its creator without editable recipient or amount', async () => {
    withWallet(<SendFlow request={{ creator: recipient, amount: '5', reference: 'INV-1' }} />);
    await screen.findByText(/Paying from/);
    expect(screen.queryByLabelText('Recipient address')).toBeNull();
    expect(screen.queryByLabelText('Amount')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Review payment' }));
    await screen.findByRole('button', { name: 'Confirm and sign' });
    const [, init] = (apiFetch as jest.Mock).mock.calls.find(([path]) => path === '/payments/intents');
    expect(JSON.parse(init.body)).toMatchObject({ recipient, amount: '5', memo: 'INV-1', asset: 'XLM' });
  });

  it('provides a deliberate lock control', async () => {
    withWallet(<SettingsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Lock wallet' }));
    expect(wallet.lock).toHaveBeenCalledTimes(1);
  });
});
