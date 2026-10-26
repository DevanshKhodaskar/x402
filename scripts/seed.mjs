import { PrismaClient } from "@prisma/client";
import { INITIAL_USERS, INITIAL_SERVICES, DEMO_PROVIDER_WALLET, DEMO_CONSUMER_WALLET, BASE_SEPOLIA_USDC, DEFAULT_NETWORK } from "../lib/seed-data.js";

async function main() {
  console.log("🌱 Starting AgentPay Database Seed...");

  // If DATABASE_URL is set, seed into Postgres
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
    const prisma = new PrismaClient();
    try {
      console.log("Connected to PostgreSQL database. Upserting seeded entities...");

      // 1. Seed Users
      for (const u of INITIAL_USERS) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            displayName: u.displayName,
            role: u.role,
            spendingLimit: u.spendingLimit,
          },
          create: {
            id: u.id,
            email: u.email,
            passwordHash: u.passwordHash,
            displayName: u.displayName,
            role: u.role,
            spendingLimit: u.spendingLimit,
          },
        });
      }

      // 2. Seed Services
      for (const s of INITIAL_SERVICES) {
        await prisma.service.upsert({
          where: { slug: s.slug },
          update: {
            name: s.name,
            description: s.description,
            price: s.price,
            status: s.status,
          },
          create: {
            id: s.id,
            providerId: s.providerId,
            name: s.name,
            slug: s.slug,
            description: s.description,
            category: s.category,
            endpointPath: s.endpointPath,
            price: s.price,
            tokenAddress: s.tokenAddress,
            network: s.network,
            recipientAddress: s.recipientAddress,
            status: s.status,
            isDemo: s.isDemo,
          },
        });
      }

      console.log("✅ PostgreSQL seeding completed successfully!");
    } catch (err) {
      console.warn("⚠️ PostgreSQL seed encountered an error (embedded memory store active):", err.message);
    } finally {
      await prisma.$disconnect();
    }
  } else {
    console.log("ℹ️ DATABASE_URL not set to PostgreSQL. AgentPay will use the self-contained in-memory persistent store initialized with demo data.");
  }
}

main().catch(console.error);
