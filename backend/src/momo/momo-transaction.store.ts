import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
    if (!this.pool) return;
    try {
      if (process.env.MOMO_AUTO_MIGRATE !== 'false') {
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

  save(record: MomoTransactionRecord): MomoTransactionRecord {
    this.records.set(record.referenceId, record);
    void this.persist(record);
    return record;
  }

  find(referenceId: string): MomoTransactionRecord | undefined {
    return this.records.get(referenceId);
  }

  findByExternalId(
    externalId: string,
    type: MomoTransactionType,
  ): MomoTransactionRecord | undefined {
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
  findReferenceIdByExternalId(
    externalId: string,
    type: MomoTransactionType,
  ): string | undefined {
    for (const record of this.records.values()) {
      if (record.externalId === externalId && record.type === type) {
        return record.referenceId;
      }
    }
    return undefined;
  }

  upsertStatus(
    referenceId: string,
    patch: Partial<Pick<MomoTransactionRecord, 'status' | 'reason'>>,
  ): MomoTransactionRecord | undefined {
    const existing = this.records.get(referenceId);
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
    this.records.set(referenceId, updated);
    void this.persist(updated);
    return updated;
  }

  listPending(): MomoTransactionRecord[] {
    return [...this.records.values()].filter((record) => record.status === 'PENDING');
  }

  clear(): void {
    this.records.clear();
    void this.pool?.query('DELETE FROM momo_transactions');
  }

  private async persist(record: MomoTransactionRecord): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(
        `INSERT INTO momo_transactions
          (reference_id, transaction_type, status, amount, currency, external_id, party_id, reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (reference_id) DO UPDATE SET
           status = EXCLUDED.status,
           reason = EXCLUDED.reason,
           updated_at = EXCLUDED.updated_at`,
        [record.referenceId, record.type, record.status, record.amount, record.currency,
          record.externalId, record.partyId, record.reason ?? null, record.createdAt, record.updatedAt],
      );
    } catch (error) {
      this.logger.error(`Unable to persist MoMo transaction ${record.referenceId}: ${error}`);
    }
  }
}
