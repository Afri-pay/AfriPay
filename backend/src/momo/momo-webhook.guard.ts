import { timingSafeEqual } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { getMomoConfig } from './momo.config';

/**
 * MTN MoMo's callback mechanism does not cryptographically sign the POST it
 * sends to X-Callback-Url, so we protect the endpoint with a shared secret
 * token appended as a query parameter when registering the callback URL,
 * e.g. https://api.afripay.io/momo/webhook/collection?token=<secret>.
 *
 * If MTN_MOMO_WEBHOOK_TOKEN is not configured, verification is skipped
 * (useful for local development against the sandbox), but a warning should
 * be logged by the caller.
 */
export function verifyWebhookToken(providedToken: string | undefined): boolean {
  const { webhookToken } = getMomoConfig();

  if (!webhookToken) {
    return true;
  }

  if (!providedToken) {
    return false;
  }

  const expected = Buffer.from(webhookToken);
  const actual = Buffer.from(providedToken);

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function assertWebhookToken(providedToken: string | undefined): void {
  if (!verifyWebhookToken(providedToken)) {
    throw new UnauthorizedException('Invalid or missing MTN MoMo webhook token');
  }
}
