import { Injectable, Logger } from '@nestjs/common';
import { assertProductConfig, getMomoConfig, MomoProductConfig } from './momo.config';
import { MomoApiException } from './momo.exceptions';
import { MomoTokenResponse } from './interfaces/momo.interfaces';

type MomoProduct = 'collection' | 'disbursement';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// Refresh a little early so we never hand out a token that expires mid-flight.
const EXPIRY_BUFFER_MS = 60_000;

@Injectable()
export class MomoAuthService {
  private readonly logger = new Logger(MomoAuthService.name);
  private readonly cache = new Map<MomoProduct, CachedToken>();

  async getToken(product: MomoProduct): Promise<string> {
    const cached = this.cache.get(product);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.accessToken;
    }

    const config = getMomoConfig();
    const productConfig = config[product];
    assertProductConfig(productConfig, product);

    const token = await this.requestToken(product, productConfig, config.baseUrl);

    this.cache.set(product, {
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000 - EXPIRY_BUFFER_MS,
    });

    return token.access_token;
  }

  /** Clears cached tokens. Exposed for tests. */
  reset(): void {
    this.cache.clear();
  }

  private async requestToken(
    product: MomoProduct,
    productConfig: MomoProductConfig,
    baseUrl: string,
  ): Promise<MomoTokenResponse> {
    const path = product === 'collection' ? '/collection/token/' : '/disbursement/token/';
    const basicAuth = Buffer.from(
      `${productConfig.apiUser}:${productConfig.apiKey}`,
    ).toString('base64');

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Ocp-Apim-Subscription-Key': productConfig.subscriptionKey,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to reach MTN MoMo ${product} token endpoint: ${err}`);
      throw new MomoApiException(`Unable to reach MTN MoMo ${product} service`);
    }

    if (!response.ok) {
      throw new MomoApiException(
        `MTN MoMo ${product} authentication failed`,
        response.status,
      );
    }

    return (await response.json()) as MomoTokenResponse;
  }
}
