import { describe, it, expect } from "vitest";
import { formatAtomicToUsd, parseUsdToAtomic, formatAtomicToUsdc } from "@/lib/utils";
import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_SIGNATURE,
  HEADER_PAYMENT_RESPONSE,
  encodeHeaderData,
  decodeHeaderData,
} from "@/lib/x402/headers";
import { X402Facilitator } from "@/lib/x402/facilitator";
import { PaymentRequirements, PaymentPayload } from "@/lib/x402/types";

describe("x402 Protocol Utilities & Encoding", () => {
  it("converts atomic units to USD accurately", () => {
    // 10000 micro-units with 6 decimals = 0.0100
    expect(formatAtomicToUsd("10000")).toBe("$0.01");
    expect(formatAtomicToUsd("20000")).toBe("$0.02");
    expect(formatAtomicToUsd("1000000")).toBe("$1.00");
    expect(formatAtomicToUsd("50000000")).toBe("$50.00");
  });

  it("converts USD strings to atomic integer representations without floats", () => {
    expect(parseUsdToAtomic("0.01")).toBe("10000");
    expect(parseUsdToAtomic("0.02")).toBe("20000");
    expect(parseUsdToAtomic("1.00")).toBe("1000000");
  });

  it("encodes and decodes x402 headers to/from Base64 JSON correctly", () => {
    const original = {
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: "eip155:84532",
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          amount: "10000",
          payTo: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          maxTimeoutSeconds: 300,
        },
      ],
    };

    const encoded = encodeHeaderData(original);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeHeaderData<typeof original>(encoded);
    expect(decoded).toEqual(original);
    expect(decoded?.x402Version).toBe(2);
    expect(decoded?.accepts[0].amount).toBe("10000");
  });
});

describe("x402 Facilitator Verification & Settlement (Mode A)", () => {
  const facilitator = new X402Facilitator({ mode: "simulated" });

  const standardRequirements: PaymentRequirements = {
    scheme: "exact",
    network: "eip155:84532",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    amount: "10000",
    payTo: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    maxTimeoutSeconds: 300,
  };

  const createValidPayload = (overrides?: Partial<any>): PaymentPayload => {
    const now = Math.floor(Date.now() / 1000);
    const nonce = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    return {
      x402Version: 2,
      accepted: standardRequirements,
      payload: {
        authorization: {
          from: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          value: "10000",
          validAfter: 0,
          validBefore: now + 300,
          nonce,
          ...overrides?.authorization,
        },
        signature: `0x${"a".repeat(130)}`, // 65-byte mock signature
        payerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        ...overrides,
      },
    };
  };

  it("verifies a valid payment payload successfully", async () => {
    const payload = createValidPayload();
    const result = await facilitator.verify(payload, standardRequirements);

    expect(result.isValid).toBe(true);
    expect(result.payerAddress?.toLowerCase()).toBe("0x90f79bf6eb2c4f870365e785982e1f101e93b906");
  });

  it("rejects payment if recipient does not match service payTo", async () => {
    const payload = createValidPayload({
      authorization: {
        to: "0x1111111111111111111111111111111111111111", // Wrong recipient
        value: "10000",
        validBefore: Math.floor(Date.now() / 1000) + 300,
        nonce: `0x${"1".repeat(64)}`,
      },
    });

    const result = await facilitator.verify(payload, standardRequirements);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("RECIPIENT_MISMATCH");
  });

  it("rejects payment if authorized amount is insufficient", async () => {
    const payload = createValidPayload({
      authorization: {
        to: standardRequirements.payTo,
        value: "5000", // Only 5,000 when 10,000 is required
        validBefore: Math.floor(Date.now() / 1000) + 300,
        nonce: `0x${"2".repeat(64)}`,
      },
    });

    const result = await facilitator.verify(payload, standardRequirements);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_AMOUNT");
  });

  it("rejects payment if authorization has expired", async () => {
    const payload = createValidPayload({
      authorization: {
        to: standardRequirements.payTo,
        value: "10000",
        validBefore: Math.floor(Date.now() / 1000) - 10, // 10 seconds in the past
        nonce: `0x${"3".repeat(64)}`,
      },
    });

    const result = await facilitator.verify(payload, standardRequirements);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("PAYMENT_EXPIRED");
  });

  it("settles verified payment and marks as simulated in Mode A", async () => {
    const payload = createValidPayload();
    const verifyResult = await facilitator.verify(payload, standardRequirements);
    expect(verifyResult.isValid).toBe(true);

    const settleResult = await facilitator.settle(payload, standardRequirements);
    expect(settleResult.isSettled).toBe(true);
    expect(settleResult.isSimulated).toBe(true);
    expect(settleResult.transactionHash).toMatch(/^0xsim_/);
  });

  it("prevents replay attacks by rejecting duplicate nonce reuse", async () => {
    const payload = createValidPayload();
    // First verification and settlement
    const v1 = await facilitator.verify(payload, standardRequirements);
    expect(v1.isValid).toBe(true);
    const s1 = await facilitator.settle(payload, standardRequirements);
    expect(s1.isSettled).toBe(true);

    // Second verification with the exact same payload/nonce should be rejected
    const v2 = await facilitator.verify(payload, standardRequirements);
    expect(v2.isValid).toBe(false);
    expect(v2.errorCode).toBe("NONCE_REUSED");
  });
});
