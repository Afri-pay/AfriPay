import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentIntentStore } from './payment-intent.store';
import { parsePayment, stroops, validatePayment } from '../stellar/payment-validation';
import { StellarService } from '../stellar/stellar.service';
import { StrKey } from '@stellar/stellar-sdk';

export type PaymentIntentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface PaymentIntent {
  id: string;
  idempotencyKey: string;
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
  memo?: string;
  status: PaymentIntentStatus;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLink {
  id: string;
  creator: string;
  amount?: string;
  asset: string;
  reference?: string;
  expiresAt?: string;
  url: string;
  createdAt: string;
}

@Injectable()
export class PaymentIntentService {
  constructor(private readonly store: PaymentIntentStore = new PaymentIntentStore()) {}

  async create(input: Omit<PaymentIntent, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'transactionHash'>): Promise<PaymentIntent> {
    validatePayment(input);
    if (typeof input.idempotencyKey !== 'string' || !input.idempotencyKey.trim() || input.idempotencyKey.length > 200) throw new ConflictException('Invalid idempotency key');
    const now = new Date().toISOString();
    const intent: PaymentIntent = {
      ...input,
      id: randomUUID(),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.store.createIntent(intent);
    if (saved.sender !== input.sender || saved.recipient !== input.recipient || saved.asset !== input.asset || stroops(saved.amount) !== stroops(input.amount) || (saved.memo ?? '') !== (input.memo ?? '')) throw new ConflictException('Idempotency key reused with different payment details');
    return saved;
  }

  async get(id: string): Promise<PaymentIntent> {
    const intent = await this.store.findIntent(id);
    if (!intent) {
      throw new NotFoundException(`Payment intent ${id} was not found`);
    }
    return intent;
  }

  list(sender?: string): Promise<PaymentIntent[]> {
    return this.store.listIntents(sender);
  }

  async submit(id: string, signedXdr: string, stellar: StellarService): Promise<PaymentIntent> {
    const intent = await this.get(id);
    const tx = parsePayment(signedXdr, intent);
    const hash = Buffer.from(tx.hash()).toString('hex');
    // Persist the hash before any network side effect. Atomic across instances.
    const claimed = await this.store.claimHash(id, hash);
    if (claimed.status !== 'PENDING') return claimed;
    const result = await stellar.submitSignedTransaction(signedXdr, intent.sender, intent);
    return this.store.settle(id, hash, result.status);
  }

  async reconcile(id: string, stellar: StellarService): Promise<PaymentIntent> {
    const intent = await this.get(id);
    if (!intent.transactionHash || intent.status !== 'PENDING') return intent;
    return this.store.settle(id, intent.transactionHash, await stellar.verifyTransaction(intent.transactionHash));
  }

  async createLink(input: Omit<PaymentLink, 'id' | 'url' | 'createdAt'>): Promise<PaymentLink> {
    if (!StrKey.isValidEd25519PublicKey(input.creator) || input.asset !== 'XLM' || (input.amount !== undefined && stroops(input.amount) <= 0) || (input.reference !== undefined && (typeof input.reference !== 'string' || Buffer.byteLength(input.reference) > 28))) throw new ConflictException('Invalid XLM payment request');
    if (input.expiresAt !== undefined && (!Number.isFinite(Date.parse(input.expiresAt)) || Date.parse(input.expiresAt) <= Date.now())) throw new ConflictException('Expiry must be in the future');
    const id = randomUUID();
    const link: PaymentLink = {
      ...input,
      expiresAt: input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      id,
      url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/pay/${id}`,
      createdAt: new Date().toISOString(),
    };
    await this.store.saveLink(link);
    return link;
  }

  async getLink(id: string): Promise<PaymentLink> {
    const link = await this.store.findLink(id);
    if (!link) throw new NotFoundException(`Payment link ${id} was not found`);
    if (link.expiresAt && Date.parse(link.expiresAt) <= Date.now()) {
      throw new ConflictException('Payment link has expired');
    }
    return link;
  }
}
