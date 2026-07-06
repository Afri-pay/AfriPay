import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnect } from './WalletConnect';

jest.mock('@stellar/freighter-api', () => ({
  isConnected: jest.fn().mockResolvedValue(false),
  isAllowed: jest.fn().mockResolvedValue(false),
  setAllowed: jest.fn(),
  getPublicKey: jest.fn(),
}));

describe('WalletConnect', () => {
  it('shows install prompt when Freighter is not installed', async () => {
    render(<WalletConnect />);
    expect(await screen.findByText(/isn.t installed/i)).toBeInTheDocument();
  });
});
