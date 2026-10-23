import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Asset, Config, Horizon, Networks, Operation, TransactionBuilder, StrKey, rpc, Memo } from '@stellar/stellar-sdk';
import { NativePayment, parsePayment, stroops, validatePayment } from './payment-validation';

@Injectable()
export class StellarService {
  private readonly horizonUrl = 'https://horizon-testnet.stellar.org';
  private readonly network = process.env.STELLAR_NETWORK || 'testnet';
  private readonly server = new Horizon.Server(this.horizonUrl);
  private readonly soroban = new rpc.Server('https://soroban-testnet.stellar.org', { timeout: 15000 });

  constructor() { Config.setTimeout(15000); }

  private assetName(value: { asset_type?: string; asset_code?: string; asset_issuer?: string }) {
    if (value.asset_type === 'native') return 'XLM';
    if (value.asset_code && value.asset_issuer) return `${value.asset_code}:${value.asset_issuer}`;
    return value.asset_type ?? 'unknown';
  }

  private parseTestnetTransaction(xdr: string, publicKey: string) {
    if (!xdr?.trim() || !StrKey.isValidEd25519PublicKey(publicKey)) throw new BadRequestException('A signed transaction and valid public key are required');
    try {
      const transaction = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
      if (!('source' in transaction) || transaction.source !== publicKey) throw new BadRequestException('Transaction source does not match wallet');
      return transaction;
    } catch (error) { if (error instanceof BadRequestException) throw error; throw new BadRequestException('Invalid Testnet transaction XDR'); }
  }

  async prepareSorobanTransaction(xdr: string, publicKey: string) {
    this.assertTestnet();
    const transaction = this.parseTestnetTransaction(xdr, publicKey);
    try { const prepared = await this.soroban.prepareTransaction(transaction); return { xdr: prepared.toXDR(), network: 'testnet' }; }
    catch (error) { throw new ServiceUnavailableException(`Soroban simulation/preparation failed: ${error instanceof Error ? error.message : 'RPC error'}`); }
  }

  async submitSorobanTransaction(xdr: string, publicKey: string) {
    this.assertTestnet();
    const transaction = this.parseTestnetTransaction(xdr, publicKey);
    try { const result = await this.soroban.sendTransaction(transaction); return { hash: result.hash, status: result.status, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}` }; }
    catch (error) { throw new ServiceUnavailableException(`Soroban submission failed: ${error instanceof Error ? error.message : 'RPC error'}`); }
  }

  async getSorobanTransaction(hash: string) {
    this.assertTestnet();
    if (!/^[a-f0-9]{64}$/i.test(hash)) throw new BadRequestException('Invalid transaction hash');
    try { return await this.soroban.getTransaction(hash); }
    catch (error) { throw new ServiceUnavailableException(`Unable to poll Soroban transaction: ${error instanceof Error ? error.message : 'RPC error'}`); }
  }

  async loadAccount(publicKey: string) {
    this.assertTestnet();
    if (!StrKey.isValidEd25519PublicKey(publicKey)) throw new BadRequestException('Invalid Stellar public key');
    try { return await this.server.loadAccount(publicKey); }
    catch (error) { if ((error as { response?: { status?: number } })?.response?.status === 404) throw new NotFoundException('Stellar account is not activated'); throw new ServiceUnavailableException(`Unable to load Stellar account: ${error instanceof Error ? error.message : 'network error'}`); }
  }

  async getAccountSummary(publicKey: string) {
    const account = await this.loadAccount(publicKey);
    return {
      publicKey,
      activated: true,
      balances: account.balances.map((balance) => ({
        asset: this.assetName(balance),
        code: balance.asset_type === 'native' ? 'XLM' : ('asset_code' in balance ? balance.asset_code : undefined),
        issuer: balance.asset_type === 'native' ? undefined : ('asset_issuer' in balance ? balance.asset_issuer : undefined),
        balance: balance.balance,
        assetType: balance.asset_type,
      })),
      sequence: account.sequence,
      subentryCount: account.subentry_count,
    };
  }

  async getHistory(publicKey: string) {
    this.assertTestnet();
    if (!StrKey.isValidEd25519PublicKey(publicKey)) throw new BadRequestException('Invalid Stellar public key');
    try {
      const page = await this.server.payments().forAccount(publicKey).limit(50).order('desc').call();
      return {
        records: page.records.map((record) => ({
          id: record.id,
          type: record.type,
          createdAt: record.created_at,
          transactionHash: record.transaction_hash,
          from: 'from' in record ? record.from : undefined,
          to: 'to' in record ? record.to : undefined,
          amount: 'amount' in record ? record.amount : undefined,
          asset: this.assetName(record as unknown as { asset_type?: string; asset_code?: string; asset_issuer?: string }),
          assetType: 'asset_type' in record ? record.asset_type : record.type,
        })),
      };
    } catch (error) { throw new ServiceUnavailableException(`Unable to load transaction history: ${error instanceof Error ? error.message : 'network error'}`); }
  }

  async fundTestnet(publicKey: string) {
    this.assertTestnet();
    if (!StrKey.isValidEd25519PublicKey(publicKey)) throw new BadRequestException('Invalid Stellar public key');
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Friendbot returned ${response.status}`);
      return { status: 'funded', network: 'testnet' };
    } catch (error) { throw new ServiceUnavailableException(`Testnet funding failed: ${error instanceof Error ? error.message : 'network error'}`); }
  }

  async buildNativePayment(sender: string, recipient: string, amount: string, memo?: string): Promise<{ xdr: string; network: string; fee: string }> {
    this.assertTestnet();
    validatePayment({ sender, recipient, amount, memo, asset: 'XLM' });
    try {
      const [account, accountDetails, , ledgerPage, feeStats] = await Promise.all([
        this.server.loadAccount(sender), this.server.accounts().accountId(sender).call(), this.server.loadAccount(recipient),
        this.server.ledgers().order('desc').limit(1).call(), this.server.feeStats(),
      ]);
      const fee = String(Math.max(100, Number(feeStats.fee_charged.p95)));
      if (!/^\d+$/.test(fee) || BigInt(fee) > BigInt(1000000)) throw new BadRequestException('Network fee exceeds wallet limit; try later');
      const units = 2 + account.subentry_count + (accountDetails.num_sponsoring ?? 0) - (accountDetails.num_sponsored ?? 0);
      const reserve = BigInt(ledgerPage.records[0].base_reserve_in_stroops) * BigInt(units);
      const native = account.balances.find((item) => item.asset_type === 'native');
      if (!native || stroops(native.balance) - stroops(native.selling_liabilities ?? '0') - reserve - BigInt(fee) < stroops(amount)) throw new BadRequestException('Insufficient spendable XLM after reserve, liabilities and fee');
      let builder = new TransactionBuilder(account, {
        fee,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.payment({ destination: recipient, asset: Asset.native(), amount }));
      if (memo) {
        builder = builder.addMemo(Memo.text(memo));
      }
      const transaction = builder.setTimeout(300).build();
      return { xdr: transaction.toXDR(), network: 'testnet', fee };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if ((error as { response?: { status?: number } }).response?.status === 404) throw new BadRequestException('Sender and destination must be activated on Testnet');
      throw new ServiceUnavailableException('Unable to prepare Stellar transaction; retry when Horizon is available');
    }
  }

  async submitSignedTransaction(signedXdr: string, expectedPublicKey?: string, expected?: NativePayment): Promise<{ hash: string; explorerUrl: string; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' }> {
    this.assertTestnet();
    if (!signedXdr?.trim()) throw new BadRequestException('signedXdr is required');
    const transaction = parsePayment(signedXdr, expected);
      if (expectedPublicKey && (!('source' in transaction) || transaction.source !== expectedPublicKey)) throw new BadRequestException('Transaction source does not match payment sender');
    const hash = transaction.hash().toString('hex');
    // A transport error may happen after acceptance. Always query the same hash;
    // never build another transaction or infer failure from a timeout.
    try { await this.server.submitTransaction(transaction); } catch { /* reconcile below */ }
    return { hash, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`, status: await this.verifyTransaction(hash) };
  }

  async verifyTransaction(hash: string): Promise<'PENDING' | 'SUCCEEDED' | 'FAILED'> {
    this.assertTestnet();
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new BadRequestException('Invalid transaction hash');
    try {
      const result = await this.server.transactions().transaction(hash).call();
      if (result.hash !== hash || !result.ledger) return 'PENDING';
      return result.successful ? 'SUCCEEDED' : 'FAILED';
    } catch { return 'PENDING'; }
  }

  private assertTestnet(): void {
    if (this.network !== 'testnet') {
      throw new BadRequestException('Only Stellar Testnet is enabled for this application');
    }
  }
}
