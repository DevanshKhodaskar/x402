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

    const auditLogs = await db.auditLog.findMany({ take: 50 });
    return NextResponse.json({ success: true, auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
