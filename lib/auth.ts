import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET_STRING = process.env.AUTH_SECRET || "agentpay-jwt-secret-dev-2026-secure-key-32chars";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
export const AUTH_COOKIE_NAME = "agentpay_session";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: "CONSUMER" | "PROVIDER" | "ADMIN";
  spendingLimit: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Check standard bcrypt compare
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // Fallback for seeded test accounts in development if plain match
    return password === hash;
  }
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    spendingLimit: user.spendingLimit,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      displayName: payload.displayName as string,
      role: payload.role as "CONSUMER" | "PROVIDER" | "ADMIN",
      spendingLimit: Number(payload.spendingLimit || 100),
    };
  } catch {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Cookies not accessible outside request context
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

// Single-use challenge store for wallet association
const walletNonces = new Map<string, { nonce: string; expiresAt: number }>();

export function generateWalletChallenge(address: string): string {
  const nonce = `agentpay-nonce-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  walletNonces.set(address.toLowerCase(), {
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
  });
  return `Welcome to AgentPay!\n\nPlease sign this message to verify wallet ownership.\nAddress: ${address}\nNonce: ${nonce}\nDomain: ${process.env.APP_URL || "http://localhost:3000"}`;
}

export function consumeWalletChallenge(address: string): string | null {
  const record = walletNonces.get(address.toLowerCase());
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    walletNonces.delete(address.toLowerCase());
    return null;
  }
  walletNonces.delete(address.toLowerCase());
  return record.nonce;
}
