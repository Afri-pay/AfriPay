import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Query } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoWebhookPayload } from './dto/momo-webhook.dto';
import { assertWebhookToken } from './momo-webhook.guard';

@Controller('momo/webhook')
export class MomoWebhookController {
  private readonly logger = new Logger(MomoWebhookController.name);

  constructor(private readonly momoService: MomoService) {}

  @Post('collection')
  @HttpCode(HttpStatus.OK)
  async collectionCallback(
    @Body() payload: MomoWebhookPayload,
    @Query('token') token?: string,
  ) {
    assertWebhookToken(token);
    const record = await this.momoService.handleCollectionCallback(payload);
    return { received: true, referenceId: record.referenceId, status: record.status };
  }

  @Post('disbursement')
  @HttpCode(HttpStatus.OK)
  async disbursementCallback(
    @Body() payload: MomoWebhookPayload,
    @Query('token') token?: string,
  ) {
    assertWebhookToken(token);
    const record = await this.momoService.handleDisbursementCallback(payload);
    return { received: true, referenceId: record.referenceId, status: record.status };
  }
}
