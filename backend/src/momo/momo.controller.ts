import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { MomoService } from './momo.service';
import { RequestToPayDto } from './dto/request-to-pay.dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('momo')
export class MomoController {
  constructor(private readonly momoService: MomoService) {}

  @Post('collections')
  async requestToPay(@Body() dto: RequestToPayDto) {
    this.validateRequestToPay(dto);
    return this.momoService.requestToPay(dto);
  }

  @Get('collections/:referenceId')
  async getCollectionStatus(@Param('referenceId') referenceId: string) {
    const record = await this.momoService.getCollectionStatus(referenceId);
    if (!record) {
      throw new NotFoundException(`No collection found for reference ${referenceId}`);
    }
    return record;
  }

  @Post('disbursements')
  async transfer(@Body() dto: TransferDto) {
    this.validateTransfer(dto);
    return this.momoService.transfer(dto);
  }

  @Get('disbursements/:referenceId')
  async getDisbursementStatus(@Param('referenceId') referenceId: string) {
    const record = await this.momoService.getDisbursementStatus(referenceId);
    if (!record) {
      throw new NotFoundException(`No disbursement found for reference ${referenceId}`);
    }
    return record;
  }

  private validateRequestToPay(dto: RequestToPayDto): void {
    if (!dto?.amount || !dto?.currency || !dto?.externalId || !dto?.payerMsisdn) {
      throw new BadRequestException(
        'amount, currency, externalId and payerMsisdn are required',
      );
    }
  }

  private validateTransfer(dto: TransferDto): void {
    if (!dto?.amount || !dto?.currency || !dto?.externalId || !dto?.payeeMsisdn) {
      throw new BadRequestException(
        'amount, currency, externalId and payeeMsisdn are required',
      );
    }
  }
}
