import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as weatherHandler } from "@/app/api/paid/weather/route";
import { POST as textAnalysisHandler } from "@/app/api/paid/text-analysis/route";
import { GET as premiumDataHandler } from "@/app/api/paid/premium-data/route";
import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_SIGNATURE,
  HEADER_PAYMENT_RESPONSE,
  decodeHeaderData,
  encodeHeaderData,
} from "@/lib/x402/headers";
import { BASE_SEPOLIA_USDC, DEMO_PROVIDER_WALLET } from "@/lib/seed-data";

describe("x402 Paywall Protection on Demonstration Endpoints", () => {
  it("GET /api/paid/weather returns HTTP 402 when unpaid", async () => {
    const req = new NextRequest("http://localhost:3000/api/paid/weather?city=Tokyo", {
      method: "GET",
    });

    const res = await weatherHandler(req);
    expect(res.status).toBe(402);

    const body = await res.json();
    expect(body.code).toBe("PAYMENT_REQUIRED");
    // Ensure protected weather payload is NOT exposed
    expect(body.data).toBeUndefined();

    // Verify PAYMENT-REQUIRED header is present
    const reqHeader = res.headers.get(HEADER_PAYMENT_REQUIRED);
    expect(reqHeader).toBeDefined();

    const decodedReq = decodeHeaderData<any>(reqHeader);
    expect(decodedReq?.x402Version).toBe(2);
    expect(decodedReq?.accepts?.[0]?.amount).toBe("10000"); // 0.01 USDC
    expect(decodedReq?.accepts?.[0]?.network).toBe("eip155:84532");
  });

  it("POST /api/paid/text-analysis returns HTTP 402 when unpaid", async () => {
    const req = new NextRequest("http://localhost:3000/api/paid/text-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello AI Agent World!" }),
    });

    const res = await textAnalysisHandler(req);
    expect(res.status).toBe(402);

    const body = await res.json();
    expect(body.code).toBe("PAYMENT_REQUIRED");
    expect(body.analytics).toBeUndefined();
  });

  it("GET /api/paid/premium-data returns HTTP 402 when unpaid", async () => {
    const req = new NextRequest("http://localhost:3000/api/paid/premium-data", {
      method: "GET",
    });

    const res = await premiumDataHandler(req);
    expect(res.status).toBe(402);

    const body = await res.json();
    expect(body.code).toBe("PAYMENT_REQUIRED");
    expect(body.dataset).toBeUndefined();
  });

  it("GET /api/paid/weather succeeds and delivers resource when valid PAYMENT-SIGNATURE is supplied", async () => {
    const now = Math.floor(Date.now() / 1000);
    const nonce = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const paymentPayload = {
      x402Version: 2,
      accepted: {
        scheme: "exact",
        network: "eip155:84532",
        asset: BASE_SEPOLIA_USDC,
        amount: "10000",
        payTo: DEMO_PROVIDER_WALLET,
        maxTimeoutSeconds: 300,
      },
      payload: {
        authorization: {
          from: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          to: DEMO_PROVIDER_WALLET,
          value: "10000",
          validAfter: 0,
          validBefore: now + 300,
          nonce,
        },
        signature: `0x${"b".repeat(130)}`,
        payerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      },
    };

    const encodedSignature = encodeHeaderData(paymentPayload);

    const req = new NextRequest("http://localhost:3000/api/paid/weather?city=Tokyo", {
      method: "GET",
      headers: {
        [HEADER_PAYMENT_SIGNATURE]: encodedSignature,
      },
    });

    const res = await weatherHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.service).toBe("weather-api");
    expect(body.data).toBeDefined();
    expect(body.data.city).toBe("Tokyo");
    expect(body.payment.status).toBe("settled");
    expect(body.payment.isSimulated).toBe(true);

    // Verify PAYMENT-RESPONSE header is attached
    const resHeader = res.headers.get(HEADER_PAYMENT_RESPONSE);
    expect(resHeader).toBeDefined();

    const decodedRes = decodeHeaderData<any>(resHeader);
    expect(decodedRes?.success).toBe(true);
    expect(decodedRes?.transaction).toMatch(/^0xsim_/);
  });
});
