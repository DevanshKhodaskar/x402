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

    // Fallback lookup by slug
    if (!service) {
      service = await db.service.findUnique({ where: { slug: id } });
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found", code: "SERVICE_NOT_FOUND" }, { status: 404 });
    }

    // Lookup provider
    const provider = await db.user.findUnique({ where: { id: service.providerId } });

    return NextResponse.json({
      success: true,
      service: {
        ...service,
        providerName: provider?.displayName || "Independent Provider",
        providerAddress: service.recipientAddress,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch service" }, { status: 500 });
  }
}
