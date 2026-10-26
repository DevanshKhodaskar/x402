import {
  PaymentRequired,
  PaymentRequirements,
  PaymentPayload,
  SettlementResponse,
  SpendControls,
} from "./types";
import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_SIGNATURE,
  HEADER_PAYMENT_RESPONSE,
  decodeHeaderData,
  encodeHeaderData,
} from "./headers";
import { EIP3009_TYPES } from "./facilitator";

export interface CreatePaymentOptions {
  signerAddress: string;
  signTypedData: (params: {
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  }) => Promise<string>;
  spendControls?: SpendControls;
}

export class X402Client {
  private spendControls?: SpendControls;

  constructor(options?: { spendControls?: SpendControls }) {
    this.spendControls = options?.spendControls;
  }

  /**
   * Extract PaymentRequired requirements from a 402 HTTP response
   */
  getPaymentRequirements(response: {
    headers: { get: (name: string) => string | null | undefined };
    jsonBody?: any;
  }): PaymentRequired | null {
    const rawHeader =
      response.headers.get(HEADER_PAYMENT_REQUIRED) ||
      response.headers.get(HEADER_PAYMENT_REQUIRED.toLowerCase()) ||
      response.headers.get("X-Payment-Required") ||
      response.headers.get("x-payment-required");

    if (rawHeader) {
      const decoded = decodeHeaderData<PaymentRequired>(rawHeader);
      if (decoded) return decoded;
    }

    if (response.jsonBody && response.jsonBody.x402) {
      return response.jsonBody.x402 as PaymentRequired;
    }

    return null;
  }

  /**
   * Select best payment option and construct signed PaymentPayload
   */
  async createPaymentPayload(
    requirementsDoc: PaymentRequired,
    options: CreatePaymentOptions
  ): Promise<PaymentPayload> {
    if (!requirementsDoc.accepts || requirementsDoc.accepts.length === 0) {
      throw new Error("No acceptable payment options provided in PaymentRequired");
    }

    // Pick first acceptable requirement
    const requirement = requirementsDoc.accepts[0];

    // Check spend controls
    if (options.spendControls?.maxAmountPerPayment) {
      const maxAtomic = BigInt(options.spendControls.maxAmountPerPayment);
      if (BigInt(requirement.amount) > maxAtomic) {
        throw new Error(
          `Payment amount (${requirement.amount}) exceeds configured spend limit (${options.spendControls.maxAmountPerPayment})`
        );
      }
    }

    // Construct EIP-3009 Authorization message
    const nowSeconds = Math.floor(Date.now() / 1000);
    const validAfter = 0;
    const validBefore = nowSeconds + (requirement.maxTimeoutSeconds || 300);
    // Generate 32-byte hex nonce
    const nonceBytes = new Uint8Array(32);
    crypto.getRandomValues(nonceBytes);
    const nonce = `0x${Array.from(nonceBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;

    const message = {
      from: options.signerAddress as `0x${string}`,
      to: requirement.payTo as `0x${string}`,
      value: BigInt(requirement.amount),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce: nonce as `0x${string}`,
    };

    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: 84532, // Base Sepolia
      verifyingContract: requirement.asset as `0x${string}`,
    };

    // Request cryptographic signature from wallet
    const signature = await options.signTypedData({
      domain,
      types: EIP3009_TYPES,
      primaryType: "TransferWithAuthorization",
      message,
    });

    const payload: PaymentPayload = {
      x402Version: 2,
      accepted: requirement,
      payload: {
        authorization: {
          from: options.signerAddress,
          to: requirement.payTo,
          value: requirement.amount,
          validAfter,
          validBefore,
          nonce,
        },
        signature,
        payerAddress: options.signerAddress,
      },
    };

    return payload;
  }

  /**
   * Helper to format HTTP request headers for retrying request with payment
   */
  encodePaymentHeaders(payload: PaymentPayload): Record<string, string> {
    const encoded = encodeHeaderData(payload);
    return {
      [HEADER_PAYMENT_SIGNATURE]: encoded,
      "X-Payment": encoded,
    };
  }

  /**
   * Extract SettlementResponse from completed response headers
   */
  getSettlementResponse(response: {
    headers: { get: (name: string) => string | null | undefined };
  }): SettlementResponse | null {
    const rawHeader =
      response.headers.get(HEADER_PAYMENT_RESPONSE) ||
      response.headers.get(HEADER_PAYMENT_RESPONSE.toLowerCase()) ||
      response.headers.get("X-Payment-Response") ||
      response.headers.get("x-payment-response");

    if (rawHeader) {
      return decodeHeaderData<SettlementResponse>(rawHeader);
    }
    return null;
  }
}

export const x402ClientInstance = new X402Client();
