import { MomoStatusResource } from '../interfaces/momo.interfaces';

/**
 * MTN posts the full RequestToPay / Transfer resource as the callback body
 * once a transaction reaches a final state (SUCCESSFUL or FAILED).
 */
export type MomoWebhookPayload = MomoStatusResource;
