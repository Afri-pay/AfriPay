import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Pool } from 'pg';
import type { PaymentIntent, PaymentLink } from './payment-intent.service';

@Injectable()
export class PaymentIntentStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentIntentStore.name);
  private readonly intents = new Map<string, PaymentIntent>();
  private readonly links = new Map<string, PaymentLink>();
  private readonly pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : undefined;

  async onModuleInit(): Promise<void> {
    if (!this.pool) return;
    const migration = await readFile(join(process.cwd(), 'migrations', '001_payment_state.sql'), 'utf8');
    await this.pool.query(migration);
    const [intents, links] = await Promise.all([
      this.pool.query('SELECT id, idempotency_key, sender, recipient, amount::text, asset, status, transaction_hash, created_at, updated_at FROM payment_intents'),
      this.pool.query('SELECT id, creator, amount::text, asset, reference, expires_at, created_at FROM payment_links'),
    ]);
    for (const row of intents.rows) {
      this.intents.set(row.id, {
        id: row.id, idempotencyKey: row.idempotency_key, sender: row.sender, recipient: row.recipient,
        amount: row.amount, asset: row.asset, status: row.status, transactionHash: row.transaction_hash ?? undefined,
        createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
      });
    }
    for (const row of links.rows) {
      this.links.set(row.id, {
        id: row.id, creator: row.creator, amount: row.amount ?? undefined, asset: row.asset,
        reference: row.reference ?? undefined, expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
        url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/pay/${row.id}`,
        createdAt: new Date(row.created_at).toISOString(),
      });
    }
  }

  async onModuleDestroy(): Promise<void> { await this.pool?.end(); }
  findIntent(id: string): PaymentIntent | undefined { return this.intents.get(id); }
  findIntentByIdempotencyKey(key: string): PaymentIntent | undefined {
    return [...this.intents.values()].find((intent) => intent.idempotencyKey === key);
  }
  listIntents(sender?: string): PaymentIntent[] {
    return [...this.intents.values()].filter((intent) => !sender || intent.sender === sender);
  }
  saveIntent(intent: PaymentIntent): void { this.intents.set(intent.id, intent); void this.persistIntent(intent); }
  findLink(id: string): PaymentLink | undefined { return this.links.get(id); }
  saveLink(link: PaymentLink): void { this.links.set(link.id, link); void this.persistLink(link); }

  private async persistIntent(intent: PaymentIntent): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(
        `INSERT INTO payment_intents
          (id, idempotency_key, sender, recipient, amount, asset, status, transaction_hash, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status,
           transaction_hash = EXCLUDED.transaction_hash, updated_at = EXCLUDED.updated_at`,
        [intent.id, intent.idempotencyKey, intent.sender, intent.recipient, intent.amount, intent.asset,
          intent.status, intent.transactionHash ?? null, intent.createdAt, intent.updatedAt],
      );
    } catch (error) { this.logger.error(`Unable to persist payment intent ${intent.id}: ${error}`); }
  }

  private async persistLink(link: PaymentLink): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(
        `INSERT INTO payment_links (id, creator, amount, asset, reference, expires_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [link.id, link.creator, link.amount ?? null, link.asset, link.reference ?? null, link.expiresAt ?? null, link.createdAt],
      );
    } catch (error) { this.logger.error(`Unable to persist payment link ${link.id}: ${error}`); }
  }
}
