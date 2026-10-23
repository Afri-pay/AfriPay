import { ConflictException, Injectable, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import type { PaymentIntent, PaymentLink } from './payment-intent.service';

@Injectable()
export class PaymentIntentStore implements OnModuleInit, OnModuleDestroy {
  private readonly intents = new Map<string, PaymentIntent>();
  private readonly links = new Map<string, PaymentLink>();
  private readonly pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : undefined;

  async onModuleInit(): Promise<void> {
    if (!this.pool && process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required for durable payments');
    if (this.pool) await this.query('SELECT id FROM payment_intents LIMIT 0');
  }
  async onModuleDestroy(): Promise<void> { await this.pool?.end(); }

  private async query(sql: string, values: unknown[] = []) {
    try { return await this.pool!.query(sql, values); }
    catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Payment reference already belongs to another record');
      throw new ServiceUnavailableException('Payment storage unavailable; retry with the same idempotency key');
    }
  }

  private intent(row: Record<string, unknown>): PaymentIntent {
    const amount = String(row.amount).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return { id: String(row.id), idempotencyKey: String(row.idempotency_key), sender: String(row.sender), recipient: String(row.recipient), amount, asset: String(row.asset), memo: row.memo ? String(row.memo) : undefined, status: row.status as PaymentIntent['status'], transactionHash: row.transaction_hash ? String(row.transaction_hash) : undefined, createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() };
  }

  async findIntent(id: string): Promise<PaymentIntent | undefined> {
    if (!this.pool) return this.intents.get(id);
    const result = await this.query('SELECT * FROM payment_intents WHERE id::text = $1', [id]);
    return result.rows[0] ? this.intent(result.rows[0]) : undefined;
  }
  async createIntent(intent: PaymentIntent): Promise<PaymentIntent> {
    if (!this.pool) {
      const existing = [...this.intents.values()].find((item) => item.idempotencyKey === intent.idempotencyKey);
      if (existing) return existing;
      this.intents.set(intent.id, intent);
      return intent;
    }
    const result = await this.query(`INSERT INTO payment_intents
      (id,idempotency_key,sender,recipient,amount,asset,memo,status,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
    [intent.id, intent.idempotencyKey, intent.sender, intent.recipient, intent.amount, intent.asset, intent.memo ?? null, intent.status, intent.createdAt, intent.updatedAt]);
    return this.intent(result.rows[0]);
  }
  async listIntents(sender?: string): Promise<PaymentIntent[]> {
    if (!this.pool) return [...this.intents.values()].filter((item) => !sender || item.sender === sender);
    const result = await this.query('SELECT * FROM payment_intents WHERE ($1::text IS NULL OR sender=$1) ORDER BY created_at DESC LIMIT 100', [sender ?? null]);
    return result.rows.map((row) => this.intent(row));
  }

  async claimHash(id: string, hash: string): Promise<PaymentIntent> {
    if (!this.pool) {
      const intent = this.intents.get(id)!;
      if (intent.transactionHash && intent.transactionHash !== hash) throw new ConflictException('Intent is already bound to another transaction');
      if ([...this.intents.values()].some((item) => item.id !== id && item.transactionHash === hash)) throw new ConflictException('Transaction already belongs to another intent');
      const updated = { ...intent, transactionHash: hash, updatedAt: new Date().toISOString() };
      this.intents.set(id, updated);
      return updated;
    }
    const result = await this.query(`UPDATE payment_intents SET transaction_hash=$2,updated_at=NOW()
      WHERE id::text=$1 AND (transaction_hash IS NULL OR transaction_hash=$2) RETURNING *`, [id, hash]);
    if (!result.rows[0]) throw new ConflictException('Intent is already bound to another transaction');
    return this.intent(result.rows[0]);
  }

  async settle(id: string, hash: string, status: PaymentIntent['status']): Promise<PaymentIntent> {
    if (!this.pool) {
      const intent = this.intents.get(id)!;
      if (intent.transactionHash !== hash) throw new ConflictException('Settlement hash mismatch');
      if (intent.status !== 'PENDING') return intent;
      const updated = { ...intent, status, updatedAt: new Date().toISOString() };
      this.intents.set(id, updated);
      return updated;
    }
    await this.query(`UPDATE payment_intents SET status=$3,updated_at=NOW() WHERE id::text=$1 AND transaction_hash=$2 AND status='PENDING'`, [id, hash, status]);
    return (await this.findIntent(id))!;
  }

  async saveLink(link: PaymentLink): Promise<void> {
    if (!this.pool) { this.links.set(link.id, link); return; }
    await this.query(`INSERT INTO payment_links (id,creator,amount,asset,reference,expires_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [link.id, link.creator, link.amount ?? null, link.asset, link.reference ?? null, link.expiresAt ?? null, link.createdAt]);
  }
  async findLink(id: string): Promise<PaymentLink | undefined> {
    if (!this.pool) return this.links.get(id);
    const result = await this.query('SELECT * FROM payment_links WHERE id::text=$1', [id]);
    const row = result.rows[0];
    if (!row) return undefined;
    return { id: row.id, creator: row.creator, amount: row.amount ? String(row.amount) : undefined, asset: row.asset, reference: row.reference ?? undefined, expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined, createdAt: new Date(row.created_at).toISOString(), url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/pay/${row.id}` };
  }
}
