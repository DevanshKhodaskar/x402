import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const userCount = await db.user.count();
    const serviceCount = await db.service.count();
    const transactions = await db.paymentTransaction.findMany();
    const attempts = await db.paymentAttempt.findMany();
    const auditLogs = await db.auditLog.findMany({ take: 20 });

    const settledTxs = transactions.filter((t: any) => t.status === "SETTLED");
    const totalVolumeAtomic = settledTxs.reduce(
      (sum: bigint, t: any) => sum + BigInt(t.amount || 0),
      BigInt(0)
    );

    const failedAttempts = attempts.filter((a: any) => a.status === "REJECTED");

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers: userCount,
        totalServices: serviceCount,
        totalTransactions: transactions.length,
        settledTransactions: settledTxs.length,
        totalVolumeAtomic: totalVolumeAtomic.toString(),
        failedPaymentAttempts: failedAttempts.length,
        systemHealth: "OPTIMAL",
      },
      recentAuditLogs: auditLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch admin overview" }, { status: 500 });
  }
}
