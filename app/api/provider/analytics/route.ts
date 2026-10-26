import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "PROVIDER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Provider role required" }, { status: 403 });
    }

    // Get provider's services
    const services = await db.service.findMany({
      where: session.role === "ADMIN" ? {} : { providerId: session.id },
    });
    const serviceIds = services.map((s: any) => s.id);

    // Get all transactions for these services
    const transactions = await db.paymentTransaction.findMany({
      where: {
        status: "SETTLED", // STRICT: Only count settled payments as revenue
      },
    });

    const providerTransactions = transactions.filter((t: any) =>
      serviceIds.includes(t.serviceId)
    );

    // Calculate gross revenue in atomic units
    const grossRevenueAtomic = providerTransactions.reduce(
      (acc: bigint, tx: any) => acc + BigInt(tx.amount || 0),
      BigInt(0)
    );

    // Revenue and requests by service
    const revenueByService = services.map((svc: any) => {
      const svcTxs = providerTransactions.filter((t: any) => t.serviceId === svc.id);
      const rev = svcTxs.reduce((sum: bigint, t: any) => sum + BigInt(t.amount || 0), BigInt(0));
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        slug: svc.slug,
        settledTransactions: svcTxs.length,
        revenueAtomic: rev.toString(),
      };
    });

    // Recent requests and failure counts
    const attempts = await db.paymentAttempt.findMany({ take: 200 });
    const failedAttempts = attempts.filter((a: any) => a.status === "REJECTED" && serviceIds.includes(a.serviceId));

    return NextResponse.json({
      success: true,
      analytics: {
        totalServices: services.length,
        totalSettledPurchases: providerTransactions.length,
        grossRevenueAtomic: grossRevenueAtomic.toString(),
        failedPaymentAttempts: failedAttempts.length,
        revenueByService,
        recentSettledTransactions: providerTransactions.slice(0, 10),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch provider analytics" }, { status: 500 });
  }
}
