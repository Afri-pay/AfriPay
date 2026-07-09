import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { MomoWebhookController } from './momo-webhook.controller';
import { MomoService } from './momo.service';

describe('MomoWebhookController', () => {
  let controller: MomoWebhookController;
  let service: {
    handleCollectionCallback: jest.Mock;
    handleDisbursementCallback: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      handleCollectionCallback: jest.fn(),
      handleDisbursementCallback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MomoWebhookController],
      providers: [{ provide: MomoService, useValue: service }],
    }).compile();

    controller = module.get<MomoWebhookController>(MomoWebhookController);
  });

  afterEach(() => {
    delete process.env.MTN_MOMO_WEBHOOK_TOKEN;
  });

  it('rejects a collection callback with an invalid token when one is configured', async () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'expected-secret';

    await expect(
      controller.collectionCallback(
        { amount: '100', currency: 'EUR', externalId: 'order-1', status: 'SUCCESSFUL' },
        'wrong-secret',
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(service.handleCollectionCallback).not.toHaveBeenCalled();
  });

  it('accepts a collection callback with the correct token', async () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'expected-secret';
    service.handleCollectionCallback.mockResolvedValue({
      referenceId: 'ref-1',
      status: 'SUCCESSFUL',
    });

    const result = await controller.collectionCallback(
      { amount: '100', currency: 'EUR', externalId: 'order-1', status: 'SUCCESSFUL' },
      'expected-secret',
    );

    expect(service.handleCollectionCallback).toHaveBeenCalled();
    expect(result).toEqual({ received: true, referenceId: 'ref-1', status: 'SUCCESSFUL' });
  });

  it('processes a disbursement callback when no token is configured', async () => {
    service.handleDisbursementCallback.mockResolvedValue({
      referenceId: 'ref-2',
      status: 'FAILED',
    });

    const result = await controller.disbursementCallback(
      { amount: '200', currency: 'EUR', externalId: 'payout-1', status: 'FAILED' },
      undefined,
    );

    expect(service.handleDisbursementCallback).toHaveBeenCalled();
    expect(result).toEqual({ received: true, referenceId: 'ref-2', status: 'FAILED' });
  });
});
