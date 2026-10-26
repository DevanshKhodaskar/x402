import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getExplorerUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tx = await db.paymentTransaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const service = await db.service.findUnique({ where: { id: tx.serviceId } });

    return NextResponse.json({
      success: true,
      transaction: {
        ...tx,
        serviceName: service?.name || "Unknown Service",
        serviceSlug: service?.slug || "",
        endpointPath: service?.endpointPath || "",
        explorerUrl: getExplorerUrl(tx.network, tx.transactionHash),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch transaction details" }, { status: 500 });
  }
}
