import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getExplorerUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));

    let transactions = await db.paymentTransaction.findMany();

    // Query filter
    if (q) {
      transactions = transactions.filter(
        (t: any) =>
          t.id.toLowerCase().includes(q) ||
          t.payerAddress.toLowerCase().includes(q) ||
          t.recipientAddress.toLowerCase().includes(q) ||
          (t.transactionHash && t.transactionHash.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status && status !== "ALL") {
      transactions = transactions.filter((t: any) => t.status === status);
    }

    // Service filter
    if (serviceId && serviceId !== "ALL") {
      transactions = transactions.filter((t: any) => t.serviceId === serviceId);
    }

    const total = transactions.length;
    const startIndex = (page - 1) * limit;
    const paginated = transactions.slice(startIndex, startIndex + limit);

    // Enrich with service information and explorer URL
    const enriched = await Promise.all(
      paginated.map(async (tx: any) => {
        const service = await db.service.findUnique({ where: { id: tx.serviceId } });
        return {
          ...tx,
          serviceName: service?.name || "Unknown Service",
          serviceSlug: service?.slug || "",
          explorerUrl: getExplorerUrl(tx.network, tx.transactionHash),
        };
      })
    );

    return NextResponse.json({
      success: true,
      transactions: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch transactions" }, { status: 500 });
  }
}
