import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, generateWalletChallenge, consumeWalletChallenge } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyMessage, isAddress } from "viem";

export const dynamic = "force-dynamic";

const ChallengeRequestSchema = z.object({
  address: z.string(),
});

const VerifyRequestSchema = z.object({
  address: z.string(),
  signature: z.string(),
  network: z.string().default("eip155:84532"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Flow 1: Request Challenge
    if (!body.signature) {
      const parsed = ChallengeRequestSchema.safeParse(body);
      if (!parsed.success || !isAddress(parsed.data.address)) {
        return NextResponse.json({ error: "Invalid EVM wallet address" }, { status: 400 });
      }

      const challengeMessage = generateWalletChallenge(parsed.data.address);
      return NextResponse.json({
        success: true,
        challenge: challengeMessage,
        address: parsed.data.address,
      });
    }

    // Flow 2: Verify Signature & Bind Wallet
    const parsed = VerifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signature payload" }, { status: 400 });
    }

    const { address, signature, network } = parsed.data;
    const nonce = consumeWalletChallenge(address);
    if (!nonce) {
      return NextResponse.json(
        { error: "Challenge expired or invalid. Please request a new challenge." },
        { status: 400 }
      );
    }

    // Verify cryptographic signature using viem
    const expectedMessage = `Welcome to AgentPay!\n\nPlease sign this message to verify wallet ownership.\nAddress: ${address}\nNonce: ${nonce}\nDomain: ${process.env.APP_URL || "http://localhost:3000"}`;

    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: expectedMessage,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Cryptographic signature verification failed" }, { status: 400 });
    }

    // Associate wallet with user in database
    const wallet = await db.wallet.create({
      data: {
        userId: session.id,
        address,
        network,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "WALLET_LINKED",
        resourceType: "WALLET",
        resourceId: wallet.id,
        metadata: { address, network },
      },
    });

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        network: wallet.network,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Wallet verification failed" }, { status: 500 });
  }
}
