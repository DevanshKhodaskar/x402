import { PaymentRequired, PaymentPayload, SettlementResponse } from "./types";

// Standard x402 V2 HTTP Headers
export const HEADER_PAYMENT_REQUIRED = "PAYMENT-REQUIRED";
export const HEADER_PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE";
export const HEADER_PAYMENT_RESPONSE = "PAYMENT-RESPONSE";

// Legacy V1 Fallback Headers
export const LEGACY_HEADER_PAYMENT = "X-PAYMENT";
export const LEGACY_HEADER_PAYMENT_REQUIRED = "X-PAYMENT-REQUIRED";
export const LEGACY_HEADER_PAYMENT_RESPONSE = "X-PAYMENT-RESPONSE";

/**
 * Base64 encode an object to standard x402 header format
 */
export function encodeHeaderData<T>(data: T): string {
  try {
    const jsonStr = JSON.stringify(data);
    return Buffer.from(jsonStr, "utf-8").toString("base64");
  } catch (error) {
    console.error("Failed to encode x402 header:", error);
    throw new Error("Failed to encode x402 header data");
  }
}

/**
 * Decode a base64 encoded x402 header string into typed object
 */
export function decodeHeaderData<T>(rawHeaderValue: string | null | undefined): T | null {
  if (!rawHeaderValue) return null;
  try {
    const trimmed = rawHeaderValue.trim();
    // Some clients may prefix with "Bearer " or quotes
    const clean = trimmed.startsWith("Bearer ") ? trimmed.slice(7).trim() : trimmed;
    const jsonStr = Buffer.from(clean, "base64").toString("utf-8");
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    // If not base64, attempt plain JSON parsing in case a client sent raw JSON
    try {
      return JSON.parse(rawHeaderValue) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Extract PaymentPayload from request headers (checking V2 and legacy headers)
 */
export function extractPaymentSignature(
  getHeader: (name: string) => string | null | undefined
): PaymentPayload | null {
  // Check V2 header
  const v2Val =
    getHeader(HEADER_PAYMENT_SIGNATURE) ||
    getHeader(HEADER_PAYMENT_SIGNATURE.toLowerCase());
  if (v2Val) {
    return decodeHeaderData<PaymentPayload>(v2Val);
  }

  // Check legacy headers
  const legacyVal =
    getHeader(LEGACY_HEADER_PAYMENT) ||
    getHeader(LEGACY_HEADER_PAYMENT.toLowerCase()) ||
    getHeader(LEGACY_HEADER_PAYMENT_REQUIRED) ||
    getHeader(LEGACY_HEADER_PAYMENT_REQUIRED.toLowerCase());
  if (legacyVal) {
    return decodeHeaderData<PaymentPayload>(legacyVal);
  }

  return null;
}
