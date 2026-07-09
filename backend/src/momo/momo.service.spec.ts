import { NotFoundException } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoAuthService } from './momo-auth.service';
import { MomoTransactionStore } from './momo-transaction.store';
import { MomoApiException } from './momo.exceptions';

describe('MomoService', () => {
  let service: MomoService;
  let auth: { getToken: jest.Mock };
  let store: MomoTransactionStore;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    auth = { getToken: jest.fn().mockResolvedValue('access-token') };
    store = new MomoTransactionStore();
    service = new MomoService(auth as unknown as MomoAuthService, store);

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    process.env.MTN_MOMO_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
    process.env.MTN_MOMO_TARGET_ENVIRONMENT = 'sandbox';
    process.env.MTN_MOMO_API_KEY = 'sub-key';
    process.env.MTN_MOMO_CALLBACK_URL = 'https://api.afripay.io/momo/webhook/collection';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestToPay (collection)', () => {
    const dto = {
      amount: '5000',
      currency: 'EUR',
      externalId: 'order-1',
      payerMsisdn: '2348012345678',
    };

    it('submits a request to pay and stores a PENDING record', async () => {
      fetchMock.mockResolvedValue({ status: 202 });

      const record = await service.requestToPay(dto);

      expect(record.status).toBe('PENDING');
      expect(record.type).toBe('COLLECTION');
      expect(record.externalId).toBe('order-1');
      expect(record.referenceId).toBeDefined();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay');
      expect(options.headers['X-Reference-Id']).toBe(record.referenceId);
      expect(options.headers['X-Callback-Url']).toBe(
        'https://api.afripay.io/momo/webhook/collection',
      );
      const body = JSON.parse(options.body);
      expect(body.payer).toEqual({ partyIdType: 'MSISDN', partyId: dto.payerMsisdn });
    });

    it('throws MomoApiException when MTN rejects the request', async () => {
      fetchMock.mockResolvedValue({ status: 400, text: async () => 'Bad request' });

      await expect(service.requestToPay(dto)).rejects.toThrow(MomoApiException);
    });
  });

  describe('transfer (disbursement)', () => {
    const dto = {
      amount: '2000',
      currency: 'EUR',
      externalId: 'payout-1',
      payeeMsisdn: '2348098765432',
    };

    it('submits a transfer and stores a PENDING record', async () => {
      fetchMock.mockResolvedValue({ status: 202 });

      const record = await service.transfer(dto);

      expect(record.status).toBe('PENDING');
      expect(record.type).toBe('DISBURSEMENT');
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://sandbox.momodeveloper.mtn.com/disbursement/v1_0/transfer');
    });

    it('throws MomoApiException on upstream failure', async () => {
      fetchMock.mockResolvedValue({ status: 500, text: async () => 'Server error' });

      await expect(service.transfer(dto)).rejects.toThrow(MomoApiException);
    });
  });

  describe('status refresh', () => {
    it('fetches and stores the latest collection status', async () => {
      fetchMock.mockResolvedValueOnce({ status: 202 });
      const created = await service.requestToPay({
        amount: '5000',
        currency: 'EUR',
        externalId: 'order-2',
        payerMsisdn: '2348012345678',
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          amount: '5000',
          currency: 'EUR',
          externalId: 'order-2',
          status: 'SUCCESSFUL',
        }),
      });

      const updated = await service.getCollectionStatus(created.referenceId);
      expect(updated.status).toBe('SUCCESSFUL');
    });

    it('throws NotFoundException for an unknown reference', async () => {
      await expect(service.getCollectionStatus('does-not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('webhook handling', () => {
    it('applies a collection callback to the matching stored transaction', async () => {
      fetchMock.mockResolvedValueOnce({ status: 202 });
      const record = await service.requestToPay({
        amount: '5000',
        currency: 'EUR',
        externalId: 'order-3',
        payerMsisdn: '2348012345678',
      });

      const updated = await service.handleCollectionCallback({
        amount: '5000',
        currency: 'EUR',
        externalId: 'order-3',
        status: 'SUCCESSFUL',
      });

      expect(updated.referenceId).toBe(record.referenceId);
      expect(updated.status).toBe('SUCCESSFUL');
      expect(service.getTransaction(record.referenceId)?.status).toBe('SUCCESSFUL');
    });

    it('applies a disbursement callback with a FAILED reason', async () => {
      fetchMock.mockResolvedValueOnce({ status: 202 });
      const record = await service.transfer({
        amount: '2000',
        currency: 'EUR',
        externalId: 'payout-2',
        payeeMsisdn: '2348098765432',
      });

      const updated = await service.handleDisbursementCallback({
        amount: '2000',
        currency: 'EUR',
        externalId: 'payout-2',
        status: 'FAILED',
        reason: { code: 'PAYEE_NOT_FOUND', message: 'Payee could not be found' },
      });

      expect(updated.status).toBe('FAILED');
      expect(updated.reason).toBe('Payee could not be found');
      expect(updated.referenceId).toBe(record.referenceId);
    });

    it('throws NotFoundException for a callback with no matching transaction', async () => {
      await expect(
        service.handleCollectionCallback({
          amount: '100',
          currency: 'EUR',
          externalId: 'unknown-order',
          status: 'SUCCESSFUL',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
