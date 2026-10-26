import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAddress } from "viem";
import { BASE_SEPOLIA_USDC, DEFAULT_NETWORK } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

const CreateServiceSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  category: z.enum(["AI_INFERENCE", "DATA_FEEDS", "FINANCIAL", "UTILITY"]),
  endpointPath: z.string().startsWith("/api/paid/"),
  price: z.string().regex(/^[0-9]+$/), // Atomic units
  tokenAddress: z.string().refine(isAddress, "Invalid ERC20 contract address").default(BASE_SEPOLIA_USDC),
  network: z.string().default(DEFAULT_NETWORK),
  recipientAddress: z.string().refine(isAddress, "Invalid recipient address"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const services = await db.service.findMany({
      where: { providerId: session.id },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch provider services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "PROVIDER" && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only registered API providers can publish services." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = CreateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, slug, description, category, endpointPath, price, tokenAddress, network, recipientAddress } = parsed.data;

    // Check slug uniqueness
    const existing = await db.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `A service with slug '${slug}' already exists.` },
        { status: 409 }
      );
    }

    const newService = await db.service.create({
      data: {
        providerId: session.id,
        name,
        slug,
        description,
        category,
        endpointPath,
        price,
        tokenAddress,
        network,
        recipientAddress,
        status: "PUBLISHED",
        isDemo: false,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "SERVICE_CREATED",
        resourceType: "SERVICE",
        resourceId: newService.id,
        metadata: { slug, name, price, network },
      },
    });

    return NextResponse.json({
      success: true,
      service: newService,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create service" }, { status: 500 });
  }
}
