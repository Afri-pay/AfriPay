export interface TransferDto {
  /** Amount as a decimal string, e.g. "5000" or "1500.50" */
  amount: string;
  /** ISO currency code, e.g. "EUR" for sandbox, "NGN"/local code in production */
  currency: string;
  /** Merchant-generated id used to reconcile the payout on our side */
  externalId: string;
  /** MSISDN of the payee, e.g. "2348012345678" (no leading +) */
  payeeMsisdn: string;
  payerMessage?: string;
  payeeNote?: string;
}
