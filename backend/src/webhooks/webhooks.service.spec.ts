import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { MomoService } from '../momo/momo.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let momoService: {
    handleCollectionCallback: jest.Mock;
    handleDisbursementCallback: jest.Mock;
  };

  beforeEach(() => {
    momoService = {
      handleCollectionCallback: jest.fn(),
      handleDisbursementCallback: jest.fn(),
    };
    service = new WebhooksService(momoService as unknown as MomoService);
  });

  afterEach(() => {
    delete process.env.MTN_MOMO_WEBHOOK_TOKEN;
  });

  it('rejects an unknown provider with NotFoundException', async () => {
    await expect(
      service.dispatch('unknown-provider', 'callback', { id: '123' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects unknown endpoint for a valid provider with BadRequestException', async () => {
    await expect(
      service.dispatch('momo', 'invalid-endpoint', { id: '123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects MoMo callback when invalid token is provided', async () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret-token';
    await expect(
      service.dispatch(
        'momo',
        'collection',
        { amount: '50', currency: 'XOF', externalId: 'ext-1' },
        'wrong-token',
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(momoService.handleCollectionCallback).not.toHaveBeenCalled();
  });

  it('routes valid MoMo collection callback through to MomoService', async () => {
    process.env.MTN_MOMO_WEBHOOK_TOKEN = 'secret-token';
    momoService.handleCollectionCallback.mockResolvedValue({
      referenceId: 'ref-momo-1',
      status: 'SUCCESSFUL',
    });

    const result = await service.dispatch(
      'momo',
      'collection',
      { amount: '50', currency: 'XOF', externalId: 'ext-1' },
      'secret-token',
    );

    expect(momoService.handleCollectionCallback).toHaveBeenCalled();
    expect(result).toEqual({
      received: true,
      referenceId: 'ref-momo-1',
      status: 'SUCCESSFUL',
      provider: 'momo',
    });
  });

  it('routes valid MoMo disbursement callback through to MomoService', async () => {
    momoService.handleDisbursementCallback.mockResolvedValue({
      referenceId: 'ref-disb-2',
      status: 'SUCCESSFUL',
    });

    const result = await service.dispatch(
      'momo',
      'disbursement',
      { amount: '100', currency: 'EUR', externalId: 'payout-2' },
      undefined,
    );

    expect(momoService.handleDisbursementCallback).toHaveBeenCalled();
    expect(result).toEqual({
      received: true,
      referenceId: 'ref-disb-2',
      status: 'SUCCESSFUL',
      provider: 'momo',
    });
  });
});
