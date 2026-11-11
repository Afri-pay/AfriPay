import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { WebhooksService, WebhookResult } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(':provider/:endpoint')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Param('endpoint') endpoint: string,
    @Body() payload: any,
    @Query('token') token?: string,
  ): Promise<WebhookResult> {
    return this.webhooksService.dispatch(provider, endpoint, payload, token);
  }
}
