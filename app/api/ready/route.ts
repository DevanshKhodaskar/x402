import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check database readiness
    const serviceCount = await db.service.count();

    return NextResponse.json({
      status: "ready",
      database: "connected",
      registeredServices: serviceCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "not_ready",
        database: "disconnected",
        error: error.message,
      },
      { status: 503 }
    );
  }
}
