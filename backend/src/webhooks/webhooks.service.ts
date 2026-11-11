import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MomoService } from '../momo/momo.service';
import { assertWebhookToken } from '../momo/momo-webhook.guard';

export interface WebhookResult {
  received: boolean;
  referenceId?: string;
  status?: string;
  provider: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly momoService: MomoService) {}

  /**
   * Dispatches provider webhook payloads to registered provider handlers.
   * Enforces token authentication and structured correlation logging.
   */
  async dispatch(
    provider: string,
    endpoint: string,
    payload: any,
    token?: string,
  ): Promise<WebhookResult> {
    const normalizedProvider = provider.toLowerCase().trim();
    const normalizedEndpoint = endpoint.toLowerCase().trim();

    const correlationId =
      payload?.referenceId || payload?.externalId || payload?.id || 'unknown';

    this.logger.log(
      `Processing webhook: provider=${normalizedProvider}, endpoint=${normalizedEndpoint}, correlationId=${correlationId}`,
    );

    switch (normalizedProvider) {
      case 'momo':
        return this.handleMomo(normalizedEndpoint, payload, token);
      default:
        this.logger.warn(`Rejected unknown webhook provider: '${normalizedProvider}'`);
        throw new NotFoundException(`Unknown webhook provider: '${provider}'`);
    }
  }

  private async handleMomo(
    endpoint: string,
    payload: any,
    token?: string,
  ): Promise<WebhookResult> {
    assertWebhookToken(token);

    if (endpoint === 'collection') {
      const record = await this.momoService.handleCollectionCallback(payload);
      return {
        received: true,
        referenceId: record.referenceId,
        status: record.status,
        provider: 'momo',
      };
    }

    if (endpoint === 'disbursement') {
      const record = await this.momoService.handleDisbursementCallback(payload);
      return {
        received: true,
        referenceId: record.referenceId,
        status: record.status,
        provider: 'momo',
      };
    }

    throw new BadRequestException(`Unknown MoMo webhook endpoint: '${endpoint}'`);
  }
}
