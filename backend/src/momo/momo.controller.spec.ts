import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MomoController } from './momo.controller';
import { MomoService } from './momo.service';

describe('MomoController', () => {
  let controller: MomoController;
  let service: {
    requestToPay: jest.Mock;
    getCollectionStatus: jest.Mock;
    transfer: jest.Mock;
    getDisbursementStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      requestToPay: jest.fn(),
      getCollectionStatus: jest.fn(),
      transfer: jest.fn(),
      getDisbursementStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MomoController],
      providers: [{ provide: MomoService, useValue: service }],
    }).compile();

    controller = module.get<MomoController>(MomoController);
  });

  it('rejects a collection request missing required fields', async () => {
    await expect(
      controller.requestToPay({
        amount: '',
        currency: '',
        externalId: '',
        payerMsisdn: '',
      } as unknown as Parameters<MomoController['requestToPay']>[0]),
    ).rejects.toThrow(BadRequestException);
    expect(service.requestToPay).not.toHaveBeenCalled();
  });

  it('delegates a valid collection request to MomoService', async () => {
    const dto = {
      amount: '5000',
      currency: 'EUR',
      externalId: 'order-1',
      payerMsisdn: '2348012345678',
    };
    service.requestToPay.mockResolvedValue({ referenceId: 'ref-1', status: 'PENDING' });

    const result = await controller.requestToPay(dto);

    expect(service.requestToPay).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ referenceId: 'ref-1', status: 'PENDING' });
  });

  it('rejects a disbursement request missing required fields', async () => {
    await expect(
      controller.transfer({
        amount: '',
        currency: '',
        externalId: '',
        payeeMsisdn: '',
      } as unknown as Parameters<MomoController['transfer']>[0]),
    ).rejects.toThrow(BadRequestException);
    expect(service.transfer).not.toHaveBeenCalled();
  });

  it('delegates a valid disbursement request to MomoService', async () => {
    const dto = {
      amount: '2000',
      currency: 'EUR',
      externalId: 'payout-1',
      payeeMsisdn: '2348098765432',
    };
    service.transfer.mockResolvedValue({ referenceId: 'ref-2', status: 'PENDING' });

    const result = await controller.transfer(dto);

    expect(service.transfer).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ referenceId: 'ref-2', status: 'PENDING' });
  });

  it('returns the collection status for a known reference', async () => {
    service.getCollectionStatus.mockResolvedValue({ referenceId: 'ref-1', status: 'SUCCESSFUL' });

    const result = await controller.getCollectionStatus('ref-1');

    expect(result).toEqual({ referenceId: 'ref-1', status: 'SUCCESSFUL' });
  });

  it('returns the disbursement status for a known reference', async () => {
    service.getDisbursementStatus.mockResolvedValue({ referenceId: 'ref-2', status: 'SUCCESSFUL' });

    const result = await controller.getDisbursementStatus('ref-2');

    expect(result).toEqual({ referenceId: 'ref-2', status: 'SUCCESSFUL' });
  });
});
