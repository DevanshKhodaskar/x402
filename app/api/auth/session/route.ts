import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Fetch fresh user details & associated wallets
  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const wallets = await db.wallet.findMany({ where: { userId: user.id } });

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      spendingLimit: user.spendingLimit,
      wallets: wallets.map((w: any) => ({
        id: w.id,
        address: w.address,
        network: w.network,
      })),
    },
  });
}
