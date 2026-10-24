import { readFile } from 'fs/promises';
import { join } from 'path';
import { Pool } from 'pg';
import { Keypair } from '@stellar/stellar-sdk';
import { PaymentIntentStore } from './payment-intent.store';
import { PaymentIntentService } from './payment-intent.service';
import { MomoTransactionStore } from '../momo/momo-transaction.store';

// Explicit isolated database only; never inherit a deployment DATABASE_URL.
const databaseTests = process.env.TEST_DATABASE_URL ? describe : describe.skip;
databaseTests('PostgreSQL payment persistence', () => {
  let pool: Pool;
  let store: PaymentIntentStore;
  const previous = process.env.DATABASE_URL;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const file of ['001_payment_state.sql', '002_payment_hash_uniqueness.sql']) await pool.query(await readFile(join(process.cwd(), 'migrations', file), 'utf8'));
    }
    store = new PaymentIntentStore();
    await store.onModuleInit();
  });
  afterAll(async () => {
    await store?.onModuleDestroy(); await pool?.end();
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  });
  it('deduplicates concurrent creation across instances and survives restart', async () => {
    const otherStore = new PaymentIntentStore();
    await otherStore.onModuleInit();
    try {
      const input = { idempotencyKey: crypto.randomUUID(), sender: Keypair.random().publicKey(), recipient: Keypair.random().publicKey(), amount: '2', asset: 'XLM' };
      const first = new PaymentIntentService(store);
      const second = new PaymentIntentService(otherStore);
      const [a, b] = await Promise.all([first.create(input), second.create(input)]);
      expect(a.id).toBe(b.id);
      const hash = crypto.randomUUID().replace(/-/g, '').repeat(2);
      await store.claimHash(a.id, hash);
      await store.settle(a.id, hash, 'SUCCEEDED');
      expect((await second.get(a.id)).status).toBe('SUCCEEDED');
      await expect(otherStore.claimHash(a.id, 'b'.repeat(64))).rejects.toThrow();
      const duplicate = await second.create({ ...input, idempotencyKey: crypto.randomUUID() });
      await expect(otherStore.claimHash(duplicate.id, hash)).rejects.toThrow();
      const restarted = new PaymentIntentStore();
      await restarted.onModuleInit();
      try { expect((await restarted.findIntent(a.id))?.transactionHash).toBe(hash); }
      finally { await restarted.onModuleDestroy(); }
    } finally { await otherStore.onModuleDestroy(); }
  });
  it('persists links and fails visibly when storage is unavailable', async () => {
    const service = new PaymentIntentService(store);
    const link = await service.createLink({ creator: Keypair.random().publicKey(), asset: 'XLM' });
    expect((await service.getLink(link.id)).creator).toBe(link.creator);
    const broken = new PaymentIntentStore();
    await broken.onModuleDestroy();
    await expect(broken.findIntent(link.id)).rejects.toThrow('Payment storage unavailable');
  });

  it('persists MoMo references and protects terminal state across two instances', async () => {
    const first = new MomoTransactionStore();
    const second = new MomoTransactionStore();
    await first.onModuleInit(); await second.onModuleInit();
    try {
      const referenceId = crypto.randomUUID();
      const record = { referenceId, type: 'COLLECTION' as const, status: 'PENDING' as const, amount: '2', currency: 'EUR', externalId: crypto.randomUUID(), partyId: '2348012345678', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await first.save(record);
      expect((await second.find(referenceId))?.externalId).toBe(record.externalId);
      await expect(second.save({ ...record, referenceId: crypto.randomUUID() })).rejects.toThrow();
      await first.upsertStatus(referenceId, { status: 'SUCCESSFUL' });
      await second.upsertStatus(referenceId, { status: 'FAILED' });
      expect((await first.find(referenceId))?.status).toBe('SUCCESSFUL');
    } finally { await first.onModuleDestroy(); await second.onModuleDestroy(); }
  });
});
