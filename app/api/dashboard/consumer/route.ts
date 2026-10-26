import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const userId = session?.id;

    // Get user's linked wallets
    let userWalletAddresses: string[] = [];
    if (userId) {
      const wallets = await db.wallet.findMany({ where: { userId } });
      userWalletAddresses = wallets.map((w: any) => w.address.toLowerCase());
    }

    // Fetch transactions belonging to user or user's wallets
    const allTxs = await db.paymentTransaction.findMany();
    const userTxs = allTxs.filter((t: any) => {
      if (userId && t.userId === userId) return true;
      if (userWalletAddresses.includes(t.payerAddress.toLowerCase())) return true;
      return false;
    });

    const settledTxs = userTxs.filter((t: any) => t.status === "SETTLED");
    const totalSpentAtomic = settledTxs.reduce(
      (sum: bigint, t: any) => sum + BigInt(t.amount || 0),
      BigInt(0)
    );

    // Spending by service
    const serviceSpendingMap: Record<string, { serviceName: string; amountAtomic: bigint; count: number }> = {};
    for (const tx of settledTxs) {
      const svc = await db.service.findUnique({ where: { id: tx.serviceId } });
      const svcName = svc?.name || tx.serviceId;
      if (!serviceSpendingMap[tx.serviceId]) {
        serviceSpendingMap[tx.serviceId] = { serviceName: svcName, amountAtomic: BigInt(0), count: 0 };
      }
      serviceSpendingMap[tx.serviceId].amountAtomic += BigInt(tx.amount || 0);
      serviceSpendingMap[tx.serviceId].count += 1;
    }

    const spendingByService = Object.entries(serviceSpendingMap).map(([serviceId, data]) => ({
      serviceId,
      serviceName: data.serviceName,
      amountAtomic: data.amountAtomic.toString(),
      count: data.count,
    }));

    // Status distribution
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      AUTHORIZED: 0,
      VERIFIED: 0,
      SETTLED: 0,
      FAILED: 0,
      EXPIRED: 0,
    };
    for (const tx of userTxs) {
      if (statusCounts[tx.status] !== undefined) {
        statusCounts[tx.status]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPurchases: settledTxs.length,
        totalSpentAtomic: totalSpentAtomic.toString(),
        spendingLimitUsd: session?.spendingLimit || 100,
        recentTransactions: userTxs.slice(0, 8),
        spendingByService,
        statusDistribution: statusCounts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch consumer dashboard" }, { status: 500 });
  }
}
