import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ModerateSchema = z.object({
  status: z.enum(["PUBLISHED", "SUSPENDED", "DRAFT"]),
  reason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = ModerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await db.service.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: `SERVICE_MODERATED_${parsed.data.status}`,
        resourceType: "SERVICE",
        resourceId: id,
        metadata: { reason: parsed.data.reason || "Administrative review" },
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to moderate service" }, { status: 500 });
  }
}
