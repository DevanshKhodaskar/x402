import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  generateWalletChallenge,
  consumeWalletChallenge,
} from "@/lib/auth";

describe("Authentication & Session Security", () => {
  it("hashes and verifies passwords securely", async () => {
    const raw = "agentPassword!2026";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    const valid = await verifyPassword(raw, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("wrongPassword", hash);
    expect(invalid).toBe(false);
  });

  it("creates and verifies signed JWT session tokens", async () => {
    const user = {
      id: "user-test-01",
      email: "agent@example.com",
      displayName: "Agent Tester",
      role: "CONSUMER" as const,
      spendingLimit: 75.0,
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("user-test-01");
    expect(verified?.email).toBe("agent@example.com");
    expect(verified?.role).toBe("CONSUMER");
    expect(verified?.spendingLimit).toBe(75.0);
  });

  it("handles wallet challenges with single-use nonces", () => {
    const address = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
    const challenge = generateWalletChallenge(address);

    expect(challenge).toContain(address);
    expect(challenge).toContain("agentpay-nonce-");

    // First consumption succeeds
    const nonce = consumeWalletChallenge(address);
    expect(nonce).not.toBeNull();

    // Second consumption fails (single-use protection)
    const nonceSecond = consumeWalletChallenge(address);
    expect(nonceSecond).toBeNull();
  });
});
