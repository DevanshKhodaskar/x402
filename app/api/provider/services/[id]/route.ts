import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const UpdateServiceSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.string().regex(/^[0-9]+$/).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SUSPENDED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const service = await db.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Authorization check
    if (service.providerId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not own this service" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await db.service.update({
      where: { id },
      data: parsed.data,
    });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "SERVICE_UPDATED",
        resourceType: "SERVICE",
        resourceId: id,
        metadata: parsed.data,
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const service = await db.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.providerId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not own this service" }, { status: 403 });
    }

    // Soft delete / suspend or remove
    await db.service.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "SERVICE_SUSPENDED",
        resourceType: "SERVICE",
        resourceId: id,
      },
    });

    return NextResponse.json({ success: true, message: "Service suspended" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}
