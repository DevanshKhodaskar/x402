import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const UpdateSettingsSchema = z.object({
  displayName: z.string().min(2).optional(),
  spendingLimit: z.number().min(0).max(100000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wallets = await db.wallet.findMany({ where: { userId: user.id } });

    return NextResponse.json({
      success: true,
      settings: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        spendingLimit: Number(user.spendingLimit),
        defaultNetwork: "eip155:84532",
        wallets: wallets.map((w: any) => ({
          id: w.id,
          address: w.address,
          network: w.network,
          createdAt: w.createdAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: session.id },
      data: parsed.data,
    });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "SETTINGS_UPDATED",
        resourceType: "USER",
        resourceId: session.id,
        metadata: parsed.data,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        spendingLimit: Number(updated.spendingLimit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
