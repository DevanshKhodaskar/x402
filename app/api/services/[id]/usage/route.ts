import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let service = await db.service.findUnique({ where: { id } });
    if (!service) {
      service = await db.service.findUnique({ where: { slug: id } });
    }
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const usages = await db.apiUsage.findMany({ where: { serviceId: service.id }, take: 100 });
    const transactions = await db.paymentTransaction.findMany({
      where: { serviceId: service.id, status: "SETTLED" },
      take: 100,
    });

    const totalRequests = usages.length;
    const totalSettledTransactions = transactions.length;
    const totalRevenueAtomic = transactions.reduce(
      (acc: bigint, tx: any) => acc + BigInt(tx.amount || 0),
      BigInt(0)
    );

    const avgDurationMs =
      usages.length > 0
        ? Math.round(usages.reduce((sum: number, u: any) => sum + (u.durationMs || 0), 0) / usages.length)
        : 0;

    return NextResponse.json({
      success: true,
      serviceId: service.id,
      metrics: {
        totalRequests,
        totalSettledTransactions,
        totalRevenueAtomic: totalRevenueAtomic.toString(),
        averageLatencyMs: avgDurationMs,
      },
      recentUsages: usages.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch usage metrics" }, { status: 500 });
  }
}
