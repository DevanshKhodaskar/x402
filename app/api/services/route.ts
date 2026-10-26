import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.toLowerCase();
    const category = searchParams.get("category");
    const network = searchParams.get("network");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));

    let services = await db.service.findMany({
      where: {
        status: "PUBLISHED",
      },
    });

    // Apply client search filter
    if (q) {
      services = services.filter(
        (s: any) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }

    // Apply category filter
    if (category && category !== "ALL") {
      services = services.filter((s: any) => s.category === category);
    }

    // Apply network filter
    if (network && network !== "ALL") {
      services = services.filter((s: any) => s.network === network);
    }

    // Sorting
    if (sort === "price_asc") {
      services.sort((a: any, b: any) => Number(BigInt(a.price) - BigInt(b.price)));
    } else if (sort === "price_desc") {
      services.sort((a: any, b: any) => Number(BigInt(b.price) - BigInt(a.price)));
    } else {
      // Newest
      services.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = services.length;
    const startIndex = (page - 1) * limit;
    const paginated = services.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      services: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch services" }, { status: 500 });
  }
}
