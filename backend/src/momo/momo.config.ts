export interface MomoProductConfig {
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
}

export interface MomoConfig {
  baseUrl: string;
  targetEnvironment: string;
  callbackUrl?: string;
  webhookToken?: string;
  collection: MomoProductConfig;
  disbursement: MomoProductConfig;
}

/**
 * Reads MTN MoMo configuration from environment variables.
 * Intentionally lazy (called per-request) rather than read at import time,
 * so unit tests can freely set process.env before invoking service methods.
 */
export function getMomoConfig(): MomoConfig {
  return {
    baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
    targetEnvironment: process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox',
    callbackUrl: process.env.MTN_MOMO_CALLBACK_URL,
    webhookToken: process.env.MTN_MOMO_WEBHOOK_TOKEN,
    collection: {
      subscriptionKey: process.env.MTN_MOMO_API_KEY || '',
      apiUser: process.env.MTN_MOMO_COLLECTION_API_USER || '',
      apiKey: process.env.MTN_MOMO_COLLECTION_API_SECRET || '',
    },
    disbursement: {
      subscriptionKey: process.env.MTN_MOMO_API_KEY || '',
      apiUser: process.env.MTN_MOMO_DISBURSEMENT_API_USER || '',
      apiKey: process.env.MTN_MOMO_DISBURSEMENT_API_SECRET || '',
    },
  };
}

export function assertProductConfig(
  product: MomoProductConfig,
  productName: string,
): void {
  if (!product.subscriptionKey || !product.apiUser || !product.apiKey) {
    throw new Error(
      `MTN MoMo ${productName} is not configured. Set MTN_MOMO_API_KEY, ` +
        `MTN_MOMO_${productName.toUpperCase()}_API_USER and ` +
        `MTN_MOMO_${productName.toUpperCase()}_API_SECRET.`,
    );
  }
}
