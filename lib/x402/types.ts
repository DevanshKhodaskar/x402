// x402 Protocol Specification V2 Core Types

export type NetworkId = `eip155:${number | "*"}` | `solana:${string}` | string;

export interface PaymentRequirements {
  scheme: "exact" | "upto" | "batch-settlement" | string;
  network: NetworkId;
  asset: string;            // ERC20 contract address (e.g., USDC)
  amount: string;           // Atomic units as integer string (e.g. "10000" = 0.01 USDC)
  payTo: string;            // Recipient wallet address
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface ResourceInfo {
  url?: string;
  description?: string;
  mimeType?: string;
  serviceId?: string;
}

export interface PaymentRequired {
  x402Version: 2;
  accepts: PaymentRequirements[];
  resource?: ResourceInfo;
  extensions?: Record<string, unknown>;
}

export interface PaymentAuthorizationPayload {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
  v?: number;
  r?: string;
  s?: string;
  signature?: string;
  [key: string]: unknown;
}

export interface PaymentPayload {
  x402Version: 2;
  accepted: PaymentRequirements;
  payload: {
    authorization: PaymentAuthorizationPayload;
    signature: string;
    payerAddress: string;
  };
  clientRequestId?: string;
  extensions?: Record<string, unknown>;
}

export interface SettlementResponse {
  success: boolean;
  network: string;
  transaction?: string;       // Real blockchain transaction hash or simulated pseudo-hash
  payer?: string;
  recipient?: string;
  amount?: string;
  asset?: string;
  settledAt?: string;
  isSimulated: boolean;
  error?: string;
  errorCode?: string;
}

export interface SpendControls {
  maxAmountPerPayment?: string; // in atomic units or USD representation
  maxDailyAmount?: string;
  allowedNetworks?: string[];
  allowedAssets?: string[];
}

export interface VerificationResult {
  isValid: boolean;
  payerAddress?: string;
  invalidReason?: string;
  errorCode?: string;
}

export interface SettlementResult {
  isSettled: boolean;
  transactionHash?: string;
  isSimulated: boolean;
  error?: string;
  errorCode?: string;
}
