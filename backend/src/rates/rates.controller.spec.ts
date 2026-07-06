import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';

describe('RatesController', () => {
  let controller: RatesController;
  let service: { getRate: jest.Mock };

  beforeEach(async () => {
    service = { getRate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatesController],
      providers: [{ provide: RatesService, useValue: service }],
    }).compile();

    controller = module.get<RatesController>(RatesController);
  });

  it('throws BadRequestException when from/to are missing', async () => {
    await expect(controller.getRate(undefined, undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('delegates to RatesService.getRate with the provided params', async () => {
    service.getRate.mockResolvedValue({ from: 'USD', to: 'NGN', rate: 1550 });

    const result = await controller.getRate('USD', 'NGN');

    expect(service.getRate).toHaveBeenCalledWith('USD', 'NGN');
    expect(result).toEqual({ from: 'USD', to: 'NGN', rate: 1550 });
  });
});
