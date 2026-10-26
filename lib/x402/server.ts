import { NextRequest, NextResponse } from "next/server";
import { db } from "../db";
import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_RESPONSE,
  encodeHeaderData,
  extractPaymentSignature,
} from "./headers";
import {
  PaymentRequired,
  PaymentRequirements,
  SettlementResponse,
} from "./types";
import { facilitator } from "./facilitator";
import { getSession } from "../auth";

export interface ProtectedRouteContext {
  serviceSlug: string;
  endpointPath: string;
}

export type ProtectedHandler = (
  req: NextRequest,
  paymentContext: {
    transactionId: string;
    payerAddress: string;
    amount: string;
    network: string;
    transactionHash: string;
    isSimulated: boolean;
  }
) => Promise<NextResponse>;

/**
 * Higher-order middleware wrapper for x402 payment-protected endpoints
 */
export function withX402Paywall(context: ProtectedRouteContext, handler: ProtectedHandler) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const requestId = req.headers.get("x-request-id") || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Authoritative lookup of service metadata from database
    const service = await db.service.findUnique({
      where: { slug: context.serviceSlug },
    });

    if (!service) {
      return NextResponse.json(
        { error: `Service '${context.serviceSlug}' is not registered or unavailable`, code: "SERVICE_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (service.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: `Service '${service.name}' is currently suspended or in draft mode`, code: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    // Build authoritative PaymentRequirements
    const authoritativeRequirements: PaymentRequirements = {
      scheme: "exact",
      network: service.network,
      asset: service.tokenAddress,
      amount: service.price,
      payTo: service.recipientAddress,
      maxTimeoutSeconds: 300, // 5 min timeout
      extra: {
        serviceId: service.id,
        serviceSlug: service.slug,
      },
    };

    // 2. Check for incoming Payment Signature header
    const paymentPayload = extractPaymentSignature((name) => req.headers.get(name));

    // If client has not provided payment signature, return HTTP 402
    if (!paymentPayload) {
      // Record payment attempt
      await db.paymentAttempt.create({
        data: {
          serviceId: service.id,
          requestId,
          status: "INITIATED",
        },
      });

      const paymentRequiredDoc: PaymentRequired = {
        x402Version: 2,
        accepts: [authoritativeRequirements],
        resource: {
          url: req.nextUrl.pathname,
          description: service.description,
          mimeType: "application/json",
          serviceId: service.id,
        },
      };

      const encodedHeader = encodeHeaderData(paymentRequiredDoc);

      // Return HTTP 402 Payment Required with PAYMENT-REQUIRED header
      return new NextResponse(
        JSON.stringify({
          error: "Payment Required",
          code: "PAYMENT_REQUIRED",
          message: "This resource requires a valid x402 payment authorization signature.",
          x402: paymentRequiredDoc,
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            [HEADER_PAYMENT_REQUIRED]: encodedHeader,
            // Also include legacy header for broad compatibility
            "X-Payment-Required": encodedHeader,
          },
        }
      );
    }

    // 3. User & Session tracking (if user is authenticated in browser or via API key)
    const session = await getSession(req);
    const userId = session?.id || null;

    // Optional client spending limit enforcement
    if (session && session.spendingLimit) {
      const priceAtomic = BigInt(service.price);
      // spendingLimit is in USD, 1 USDC = 10^6 atomic units
      const maxAtomic = BigInt(Math.floor(session.spendingLimit * 1_000_000));
      if (priceAtomic > maxAtomic) {
        return NextResponse.json(
          {
            error: "Payment exceeds user configured spending limit",
            code: "SPENDING_LIMIT_EXCEEDED",
            spendingLimitUsd: session.spendingLimit,
          },
          { status: 403 }
        );
      }
    }

    // 4. Verify Payment Authorization
    const verifyResult = await facilitator.verify(paymentPayload, authoritativeRequirements);

    if (!verifyResult.isValid) {
      // Record failed attempt
      await db.paymentAttempt.create({
        data: {
          serviceId: service.id,
          requestId,
          payerAddress: paymentPayload.payload?.payerAddress || null,
          status: "REJECTED",
          errorCode: verifyResult.errorCode || "INVALID_PAYMENT",
        },
      });

      return NextResponse.json(
        {
          error: verifyResult.invalidReason || "Payment verification failed",
          code: verifyResult.errorCode || "PAYMENT_VERIFICATION_FAILED",
          details: "The cryptographic payment authorization did not meet service requirements.",
        },
        { status: 402 }
      );
    }

    const payerAddress = verifyResult.payerAddress!;

    // 5. Settle Payment
    const settleResult = await facilitator.settle(paymentPayload, authoritativeRequirements);

    if (!settleResult.isSettled) {
      await db.paymentAttempt.create({
        data: {
          serviceId: service.id,
          requestId,
          payerAddress,
          status: "REJECTED",
          errorCode: settleResult.errorCode || "SETTLEMENT_FAILED",
        },
      });

      return NextResponse.json(
        {
          error: settleResult.error || "Payment settlement failed",
          code: settleResult.errorCode || "PAYMENT_SETTLEMENT_FAILED",
        },
        { status: 402 }
      );
    }

    const txHash = settleResult.transactionHash!;
    const isSimulated = settleResult.isSimulated;

    // 6. Record settled transaction in database
    const transaction = await db.paymentTransaction.create({
      data: {
        userId,
        serviceId: service.id,
        payerAddress,
        recipientAddress: authoritativeRequirements.payTo,
        amount: authoritativeRequirements.amount,
        tokenAddress: authoritativeRequirements.asset,
        network: authoritativeRequirements.network,
        protocolVersion: "2.0",
        paymentScheme: authoritativeRequirements.scheme,
        status: "SETTLED",
        transactionHash: txHash,
        isSimulated,
        settledAt: new Date(),
      },
    });

    // Record usage event
    const durationMs = Date.now() - startTime;
    await db.apiUsage.create({
      data: {
        serviceId: service.id,
        transactionId: transaction.id,
        statusCode: 200,
        durationMs,
      },
    });

    // 7. Prepare settlement response header
    const settlementDoc: SettlementResponse = {
      success: true,
      network: authoritativeRequirements.network,
      transaction: txHash,
      payer: payerAddress,
      recipient: authoritativeRequirements.payTo,
      amount: authoritativeRequirements.amount,
      asset: authoritativeRequirements.asset,
      settledAt: new Date().toISOString(),
      isSimulated,
    };

    const encodedSettlementHeader = encodeHeaderData(settlementDoc);

    // 8. Execute protected business logic
    const response = await handler(req, {
      transactionId: transaction.id,
      payerAddress,
      amount: authoritativeRequirements.amount,
      network: authoritativeRequirements.network,
      transactionHash: txHash,
      isSimulated,
    });

    // Attach x402 PAYMENT-RESPONSE header to the final response
    response.headers.set(HEADER_PAYMENT_RESPONSE, encodedSettlementHeader);
    response.headers.set("X-Payment-Response", encodedSettlementHeader);

    return response;
  };
}
