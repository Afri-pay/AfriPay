import { randomUUID } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MomoAuthService } from './momo-auth.service';
import { MomoTransactionStore } from './momo-transaction.store';
import { getMomoConfig } from './momo.config';
import { MomoApiException } from './momo.exceptions';
import { RequestToPayDto } from './dto/request-to-pay.dto';
import { TransferDto } from './dto/transfer.dto';
import { MomoWebhookPayload } from './dto/momo-webhook.dto';
import {
  MomoStatusResource,
  MomoTransactionRecord,
} from './interfaces/momo.interfaces';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);

  constructor(
    private readonly auth: MomoAuthService,
    private readonly store: MomoTransactionStore,
  ) {}

  // ---------------------------------------------------------------------
  // Collections (receiving money from a customer's mobile money wallet)
  // ---------------------------------------------------------------------

  async requestToPay(dto: RequestToPayDto): Promise<MomoTransactionRecord> {
    const referenceId = randomUUID();
    const config = getMomoConfig();
    const token = await this.auth.getToken('collection');

    const body = {
      amount: dto.amount,
      currency: dto.currency,
      externalId: dto.externalId,
      payer: { partyIdType: 'MSISDN', partyId: dto.payerMsisdn },
      payerMessage: dto.payerMessage ?? '',
      payeeNote: dto.payeeNote ?? '',
    };

    await this.callMomo(
      'collection',
      `${config.baseUrl}/collection/v1_0/requesttopay`,
      referenceId,
      token,
      body,
    );

    return this.store.save({
      referenceId,
      type: 'COLLECTION',
      status: 'PENDING',
      amount: dto.amount,
      currency: dto.currency,
      externalId: dto.externalId,
      partyId: dto.payerMsisdn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getCollectionStatus(referenceId: string): Promise<MomoTransactionRecord> {
    return this.refreshStatus('collection', referenceId);
  }

  // ---------------------------------------------------------------------
  // Disbursements (sending money to a customer's mobile money wallet)
  // ---------------------------------------------------------------------

  async transfer(dto: TransferDto): Promise<MomoTransactionRecord> {
    const referenceId = randomUUID();
    const config = getMomoConfig();
    const token = await this.auth.getToken('disbursement');

    const body = {
      amount: dto.amount,
      currency: dto.currency,
      externalId: dto.externalId,
      payee: { partyIdType: 'MSISDN', partyId: dto.payeeMsisdn },
      payerMessage: dto.payerMessage ?? '',
      payeeNote: dto.payeeNote ?? '',
    };

    await this.callMomo(
      'disbursement',
      `${config.baseUrl}/disbursement/v1_0/transfer`,
      referenceId,
      token,
      body,
    );

    return this.store.save({
      referenceId,
      type: 'DISBURSEMENT',
      status: 'PENDING',
      amount: dto.amount,
      currency: dto.currency,
      externalId: dto.externalId,
      partyId: dto.payeeMsisdn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getDisbursementStatus(referenceId: string): Promise<MomoTransactionRecord> {
    return this.refreshStatus('disbursement', referenceId);
  }

  // ---------------------------------------------------------------------
  // Webhooks (MTN posts the final resource to our X-Callback-Url)
  // ---------------------------------------------------------------------

  async handleCollectionCallback(
    payload: MomoWebhookPayload,
  ): Promise<MomoTransactionRecord> {
    return this.applyCallback('COLLECTION', payload);
  }

  async handleDisbursementCallback(
    payload: MomoWebhookPayload,
  ): Promise<MomoTransactionRecord> {
    return this.applyCallback('DISBURSEMENT', payload);
  }

  getTransaction(referenceId: string): MomoTransactionRecord | undefined {
    return this.store.find(referenceId);
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private applyCallback(
    type: 'COLLECTION' | 'DISBURSEMENT',
    payload: MomoWebhookPayload,
  ): MomoTransactionRecord {
    const referenceId = this.store.findReferenceIdByExternalId(payload.externalId, type);

    if (!referenceId) {
      this.logger.warn(
        `Received MTN ${type} callback for unknown externalId=${payload.externalId}`,
      );
      throw new NotFoundException(
        `No matching ${type.toLowerCase()} transaction for externalId ${payload.externalId}`,
      );
    }

    const reason =
      typeof payload.reason === 'string' ? payload.reason : payload.reason?.message;

    const updated = this.store.upsertStatus(referenceId, {
      status: payload.status,
      reason,
    });

    if (!updated) {
      throw new NotFoundException(`Unknown transaction reference ${referenceId}`);
    }

    this.logger.log(
      `MTN ${type} callback processed: referenceId=${referenceId} status=${payload.status}`,
    );

    return updated;
  }

  private async refreshStatus(
    product: 'collection' | 'disbursement',
    referenceId: string,
  ): Promise<MomoTransactionRecord> {
    const existing = this.store.find(referenceId);
    if (!existing) {
      throw new NotFoundException(`Unknown transaction reference ${referenceId}`);
    }

    const config = getMomoConfig();
    const token = await this.auth.getToken(product);
    const path =
      product === 'collection'
        ? `/collection/v1_0/requesttopay/${referenceId}`
        : `/disbursement/v1_0/transfer/${referenceId}`;

    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': config.targetEnvironment,
          'Ocp-Apim-Subscription-Key': config[product].subscriptionKey,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to reach MTN MoMo ${product} status endpoint: ${err}`);
      throw new MomoApiException(`Unable to reach MTN MoMo ${product} service`);
    }

    if (!response.ok) {
      throw new MomoApiException(
        `MTN MoMo ${product} status check failed`,
        response.status,
      );
    }

    const resource = (await response.json()) as MomoStatusResource;
    const reason =
      typeof resource.reason === 'string' ? resource.reason : resource.reason?.message;

    return (
      this.store.upsertStatus(referenceId, { status: resource.status, reason }) ??
      existing
    );
  }

  private async callMomo(
    product: 'collection' | 'disbursement',
    url: string,
    referenceId: string,
    token: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    const config = getMomoConfig();

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': config.targetEnvironment,
          'Ocp-Apim-Subscription-Key': config[product].subscriptionKey,
          'Content-Type': 'application/json',
          ...(config.callbackUrl ? { 'X-Callback-Url': config.callbackUrl } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`Failed to reach MTN MoMo ${product} endpoint: ${err}`);
      throw new MomoApiException(`Unable to reach MTN MoMo ${product} service`);
    }

    // MTN MoMo returns 202 Accepted with no body when the request is queued.
    if (response.status !== 202) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {
        // ignore - best effort only
      }
      throw new MomoApiException(
        `MTN MoMo ${product} request rejected${detail ? `: ${detail}` : ''}`,
        response.status,
      );
    }
  }
}
