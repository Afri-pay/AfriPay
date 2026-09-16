import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Asset, Horizon, Networks, Operation, TransactionBuilder, Keypair, StrKey } from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private readonly horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
  private readonly network = process.env.STELLAR_NETWORK || 'testnet';
  private readonly server = new Horizon.Server(this.horizonUrl);

  async loadAccount(publicKey: string) {
    if (!StrKey.isValidEd25519PublicKey(publicKey)) throw new BadRequestException('Invalid Stellar public key');
    try { return await this.server.loadAccount(publicKey); }
    catch (error) { throw new ServiceUnavailableException(`Unable to load Stellar account: ${error instanceof Error ? error.message : 'network error'}`); }
  }

  async fundTestnet(publicKey: string) {
    this.assertTestnet();
    if (!StrKey.isValidEd25519PublicKey(publicKey)) throw new BadRequestException('Invalid Stellar public key');
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) throw new Error(`Friendbot returned ${response.status}`);
      return { status: 'funded', network: 'testnet' };
    } catch (error) { throw new ServiceUnavailableException(`Testnet funding failed: ${error instanceof Error ? error.message : 'network error'}`); }
  }

  async buildNativePayment(sender: string, recipient: string, amount: string): Promise<{ xdr: string; network: string }> {
    this.assertTestnet();
    if (!/^G[A-Z2-7]{55}$/.test(sender) || !/^G[A-Z2-7]{55}$/.test(recipient)) {
      throw new BadRequestException('sender and recipient must be valid Stellar public keys');
    }
    if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) {
      throw new BadRequestException('amount must be a positive decimal with at most 7 places');
    }
    try {
      const account = await this.server.loadAccount(sender);
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount }))
        .setTimeout(300)
        .build();
      return { xdr: transaction.toXDR(), network: 'testnet' };
    } catch (error) {
      throw new ServiceUnavailableException(`Unable to prepare Stellar transaction: ${error}`);
    }
  }

  async submitSignedTransaction(signedXdr: string): Promise<{ hash: string; explorerUrl: string }> {
    this.assertTestnet();
    if (!signedXdr?.trim()) throw new BadRequestException('signedXdr is required');
    try {
      const transaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      const result = await this.server.submitTransaction(transaction);
      return {
        hash: result.hash,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error) {
      throw new ServiceUnavailableException(`Stellar testnet submission failed: ${error}`);
    }
  }

  private assertTestnet(): void {
    if (this.network !== 'testnet') {
      throw new BadRequestException('Only Stellar Testnet is enabled for this application');
    }
  }
}
