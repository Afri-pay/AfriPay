import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentIntentStore } from './payment-intent.store';

export type PaymentIntentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface PaymentIntent {
  id: string;
  idempotencyKey: string;
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
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

  create(input: Omit<PaymentIntent, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'transactionHash'>): PaymentIntent {
    const existing = this.store.findIntentByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return existing;
    }
    if (input.sender === input.recipient) {
      throw new ConflictException('Sender and recipient must differ');
    }
    if (!/^\d+(\.\d{1,7})?$/.test(input.amount) || Number(input.amount) <= 0) {
      throw new ConflictException('Amount must be a positive decimal');
    }
    const now = new Date().toISOString();
    const intent: PaymentIntent = {
      ...input,
      id: randomUUID(),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveIntent(intent);
    return intent;
  }

  get(id: string): PaymentIntent {
    const intent = this.store.findIntent(id);
    if (!intent) {
      throw new NotFoundException(`Payment intent ${id} was not found`);
    }
    return intent;
  }

  list(sender?: string): PaymentIntent[] {
    return this.store.listIntents(sender);
  }

  markSubmitted(id: string, transactionHash: string): PaymentIntent {
    const intent = this.get(id);
    const updated = { ...intent, status: 'SUCCEEDED' as const, transactionHash, updatedAt: new Date().toISOString() };
    this.store.saveIntent(updated);
    return updated;
  }

  createLink(input: Omit<PaymentLink, 'id' | 'url' | 'createdAt'>): PaymentLink {
    const id = randomUUID();
    const link: PaymentLink = {
      ...input,
      id,
      url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/pay/${id}`,
      createdAt: new Date().toISOString(),
    };
    this.store.saveLink(link);
    return link;
  }

  getLink(id: string): PaymentLink {
    const link = this.store.findLink(id);
    if (!link) throw new NotFoundException(`Payment link ${id} was not found`);
    if (link.expiresAt && Date.parse(link.expiresAt) <= Date.now()) {
      throw new ConflictException('Payment link has expired');
    }
    return link;
  }
}
