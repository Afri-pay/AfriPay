import { ConflictException, Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { MomoTransactionRecord, MomoTransactionType } from './interfaces/momo.interfaces';

/**
 * In-memory record of MoMo collection/disbursement transactions.
 *
 * This keeps the momo module self-contained and easily testable without a
 * database dependency. Swap this out for a TypeORM-backed repository once
 * a `momo_transactions` table/migration is added — the public interface
 * below is intentionally small so that can happen without touching
 * MomoService callers.
 */
@Injectable()
export class MomoTransactionStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MomoTransactionStore.name);
  private readonly records = new Map<string, MomoTransactionRecord>();
  private readonly pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : undefined;

  async onModuleInit(): Promise<void> {
    if (!this.pool && process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required for durable MoMo transactions');
    if (!this.pool) return;
    try {
      if (process.env.MOMO_AUTO_MIGRATE === 'true' && process.env.NODE_ENV !== 'production') {
        const migration = await readFile(join(process.cwd(), 'migrations', '001_payment_state.sql'), 'utf8');
        await this.pool.query(migration);
      }
      const result = await this.pool.query(
        `SELECT reference_id, transaction_type, status, amount::text, currency,
                external_id, party_id, reason, created_at, updated_at
           FROM momo_transactions`,
      );
      for (const row of result.rows) {
        this.records.set(row.reference_id, {
          referenceId: row.reference_id,
          type: row.transaction_type,
          status: row.status,
          amount: row.amount,
          currency: row.currency,
          externalId: row.external_id,
          partyId: row.party_id,
          reason: row.reason ?? undefined,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Unable to load MoMo transactions from PostgreSQL: ${error}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async save(record: MomoTransactionRecord): Promise<MomoTransactionRecord> {
    if (!this.pool) {
      if ([...this.records.values()].some((item) => item.type === record.type && item.externalId === record.externalId && item.referenceId !== record.referenceId)) throw new ConflictException('Provider reference already exists');
      this.records.set(record.referenceId, record);
      return record;
    }
    await this.persist(record);
    this.records.set(record.referenceId, record);
    return record;
  }

  async find(referenceId: string): Promise<MomoTransactionRecord | undefined> {
    if (this.pool) {
      const result = await this.query('SELECT * FROM momo_transactions WHERE reference_id::text=$1', [referenceId]);
      return result.rows[0] ? this.fromRow(result.rows[0]) : undefined;
    }
    return this.records.get(referenceId);
  }

  async findByExternalId(
    externalId: string,
    type: MomoTransactionType,
  ): Promise<MomoTransactionRecord | undefined> {
    if (this.pool) {
      const result = await this.query('SELECT * FROM momo_transactions WHERE external_id=$1 AND transaction_type=$2', [externalId, type]);
      return result.rows[0] ? this.fromRow(result.rows[0]) : undefined;
    }
    for (const record of this.records.values()) {
      if (record.externalId === externalId && record.type === type) {
        return record;
      }
    }
    return undefined;
  }

  /**
   * MTN callbacks are keyed by externalId (our merchant reference), not the
   * X-Reference-Id we generated, so webhook handling needs a reverse lookup.
   */
  async findReferenceIdByExternalId(
    externalId: string,
    type: MomoTransactionType,
  ): Promise<string | undefined> {
    if (this.pool) return (await this.findByExternalId(externalId, type))?.referenceId;
    for (const record of this.records.values()) {
      if (record.externalId === externalId && record.type === type) {
        return record.referenceId;
      }
    }
    return undefined;
  }

  async upsertStatus(
    referenceId: string,
    patch: Partial<Pick<MomoTransactionRecord, 'status' | 'reason'>>,
  ): Promise<MomoTransactionRecord | undefined> {
    const existing = await this.find(referenceId);
    if (!existing) {
      return undefined;
    }
    const nextStatus = patch.status ?? existing.status;
    const terminal = existing.status === 'SUCCESSFUL' || existing.status === 'FAILED';
    // Provider retries are expected. A terminal transaction must not be
    // moved back to PENDING or to a conflicting terminal state.
    if (terminal && nextStatus !== existing.status) {
      return existing;
    }
    const updated: MomoTransactionRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.persist(updated);
    this.records.set(referenceId, updated);
    if (this.pool) return this.find(referenceId);
    return updated;
  }

  async listPending(): Promise<MomoTransactionRecord[]> {
    if (this.pool) return (await this.query("SELECT * FROM momo_transactions WHERE status='PENDING'", [])).rows.map((row) => this.fromRow(row));
    return [...this.records.values()].filter((record) => record.status === 'PENDING');
  }

  clear(): void {
    if (this.pool) throw new Error('clear is only supported for isolated memory tests');
    this.records.clear();
  }

  private async persist(record: MomoTransactionRecord): Promise<void> {
    if (!this.pool) return;
    try {
      await this.query(
        `INSERT INTO momo_transactions
          (reference_id, transaction_type, status, amount, currency, external_id, party_id, reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (reference_id) DO UPDATE SET
           status = EXCLUDED.status,
           reason = EXCLUDED.reason,
           updated_at = EXCLUDED.updated_at
         WHERE momo_transactions.status = 'PENDING'`,
        [record.referenceId, record.type, record.status, record.amount, record.currency,
          record.externalId, record.partyId, record.reason ?? null, record.createdAt, record.updatedAt],
      );
    } catch (error) { if (error instanceof ConflictException) throw error; throw new ServiceUnavailableException('MoMo storage unavailable'); }
  }

  private async query(sql: string, values: unknown[]) {
    try { return await this.pool!.query(sql, values); }
    catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Provider reference already exists; retrieve its status');
      throw new ServiceUnavailableException('MoMo storage unavailable');
    }
  }

  private fromRow(row: Record<string, unknown>): MomoTransactionRecord {
    return { referenceId: String(row.reference_id), type: row.transaction_type as MomoTransactionType, status: row.status as MomoTransactionRecord['status'], amount: String(row.amount), currency: String(row.currency), externalId: String(row.external_id), partyId: String(row.party_id), reason: row.reason ? String(row.reason) : undefined, createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() };
  }
}
