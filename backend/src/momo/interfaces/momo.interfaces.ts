export type MomoPartyIdType = 'MSISDN' | 'EMAIL' | 'PARTY_CODE';

export interface MomoParty {
  partyIdType: MomoPartyIdType;
  partyId: string;
}

export type MomoTransactionType = 'COLLECTION' | 'DISBURSEMENT';

export type MomoTransactionStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface MomoTransactionRecord {
  referenceId: string;
  type: MomoTransactionType;
  status: MomoTransactionStatus;
  amount: string;
  currency: string;
  externalId: string;
  partyId: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape of the resource MTN MoMo returns from the "Get Request to Pay" /
 * "Get Transfer" status endpoints, and also the shape it POSTs to the
 * X-Callback-Url when the transaction reaches a final state.
 */
export interface MomoStatusResource {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId: string;
  payer?: MomoParty;
  payee?: MomoParty;
  status: MomoTransactionStatus;
  reason?: {
    code: string;
    message: string;
  } | string;
}

export interface MomoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
