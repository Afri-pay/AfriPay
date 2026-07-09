import { Injectable } from '@nestjs/common';
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
export class MomoTransactionStore {
  private readonly records = new Map<string, MomoTransactionRecord>();

  save(record: MomoTransactionRecord): MomoTransactionRecord {
    this.records.set(record.referenceId, record);
    return record;
  }

  find(referenceId: string): MomoTransactionRecord | undefined {
    return this.records.get(referenceId);
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
    const updated: MomoTransactionRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(referenceId, updated);
    return updated;
  }

  clear(): void {
    this.records.clear();
  }
}
