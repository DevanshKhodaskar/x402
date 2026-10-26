import { PrismaClient } from "@prisma/client";
import { INITIAL_USERS, INITIAL_SERVICES, DemoUser, DemoService } from "./seed-data";

// Declare global prisma for Next.js hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;
let usePrisma = false;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
    usePrisma = true;
  } catch (e) {
    console.warn("Prisma initialization failed, falling back to embedded database:", e);
    usePrisma = false;
  }
}

// In-Memory Resilient Store for development, testing, or standalone execution
class MemoryStorage {
  users: Map<string, any> = new Map();
  services: Map<string, any> = new Map();
  wallets: Map<string, any> = new Map();
  transactions: Map<string, any> = new Map();
  attempts: Map<string, any> = new Map();
  usages: any[] = [];
  auditLogs: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // Seed Users
    for (const u of INITIAL_USERS) {
      this.users.set(u.id, { ...u });
      for (const w of u.wallets) {
        this.wallets.set(w.id, { ...w, userId: u.id, createdAt: new Date() });
      }
    }

    // Seed Services
    for (const s of INITIAL_SERVICES) {
      this.services.set(s.id, { ...s });
    }

    // Seed initial mock settled transaction for demo provider analytics
    const initialTxId = "tx-demo-init-001";
    this.transactions.set(initialTxId, {
      id: initialTxId,
      userId: "user-consumer-01",
      serviceId: "svc-weather-001",
      payerAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      recipientAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      amount: "10000",
      tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      network: "eip155:84532",
      protocolVersion: "2.0",
      paymentScheme: "exact",
      status: "SETTLED",
      transactionHash: "0xsim_seed_demo_settled_tx_001",
      isSimulated: true,
      errorMessage: null,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
      settledAt: new Date(Date.now() - 3600 * 1000 * 24),
    });

    this.usages.push({
      id: "usage-init-001",
      serviceId: "svc-weather-001",
      transactionId: initialTxId,
      statusCode: 200,
      durationMs: 42,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    });

    this.auditLogs.push({
      id: "audit-init-001",
      actorId: "user-admin-03",
      action: "PLATFORM_INIT",
      resourceType: "SYSTEM",
      resourceId: "agentpay-v1",
      metadata: { status: "initialized", servicesSeeded: 3 },
      createdAt: new Date(),
    });
  }

  user = {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) return this.users.get(where.id) || null;
      if (where.email) {
        for (const u of this.users.values()) {
          if (u.email.toLowerCase() === where.email.toLowerCase()) return { ...u };
        }
      }
      return null;
    },
    findFirst: async ({ where }: { where?: any }) => {
      for (const u of this.users.values()) {
        if (!where) return { ...u };
        let match = true;
        if (where.email && u.email.toLowerCase() !== where.email.toLowerCase()) match = false;
        if (where.id && u.id !== where.id) match = false;
        if (where.role && u.role !== where.role) match = false;
        if (match) return { ...u };
      }
      return null;
    },
    findMany: async () => {
      return Array.from(this.users.values()).map((u) => ({ ...u }));
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newUser = {
        id,
        role: "CONSUMER",
        spendingLimit: 100.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.users.set(id, newUser);
      return { ...newUser };
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = this.users.get(where.id);
      if (!existing) throw new Error(`User not found: ${where.id}`);
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.users.set(where.id, updated);
      return { ...updated };
    },
    count: async () => this.users.size,
  };

  wallet = {
    findMany: async ({ where }: { where?: { userId?: string; address?: string } }) => {
      const result: any[] = [];
      for (const w of this.wallets.values()) {
        if (where?.userId && w.userId !== where.userId) continue;
        if (where?.address && w.address.toLowerCase() !== where.address.toLowerCase()) continue;
        result.push({ ...w });
      }
      return result;
    },
    create: async ({ data }: { data: any }) => {
      const id = `wallet-${Date.now()}`;
      const newWallet = { id, createdAt: new Date(), ...data };
      this.wallets.set(id, newWallet);
      return { ...newWallet };
    },
    deleteMany: async ({ where }: { where: { userId: string } }) => {
      let count = 0;
      for (const [key, val] of this.wallets.entries()) {
        if (val.userId === where.userId) {
          this.wallets.delete(key);
          count++;
        }
      }
      return { count };
    },
  };

  service = {
    findUnique: async ({ where }: { where: { id?: string; slug?: string; endpointPath?: string } }) => {
      if (where.id) return this.services.get(where.id) || null;
      for (const s of this.services.values()) {
        if (where.slug && s.slug === where.slug) return { ...s };
        if (where.endpointPath && s.endpointPath === where.endpointPath) return { ...s };
      }
      return null;
    },
    findMany: async (params?: { where?: any; orderBy?: any; take?: number; skip?: number }) => {
      let list = Array.from(this.services.values());
      if (params?.where) {
        const w = params.where;
        list = list.filter((s) => {
          if (w.providerId && s.providerId !== w.providerId) return false;
          if (w.status && s.status !== w.status) return false;
          if (w.category && s.category !== w.category) return false;
          if (w.network && s.network !== w.network) return false;
          return true;
        });
      }
      if (params?.skip) list = list.slice(params.skip);
      if (params?.take) list = list.slice(0, params.take);
      return list.map((s) => ({ ...s }));
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newService = {
        id,
        status: "PUBLISHED",
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.services.set(id, newService);
      return { ...newService };
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = this.services.get(where.id);
      if (!existing) throw new Error(`Service not found: ${where.id}`);
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.services.set(where.id, updated);
      return { ...updated };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const existing = this.services.get(where.id);
      this.services.delete(where.id);
      return existing;
    },
    count: async () => this.services.size,
  };

  paymentTransaction = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return this.transactions.get(where.id) || null;
    },
    findMany: async (params?: { where?: any; orderBy?: any; take?: number; skip?: number }) => {
      let list = Array.from(this.transactions.values());
      if (params?.where) {
        const w = params.where;
        list = list.filter((t) => {
          if (w.userId && t.userId !== w.userId) return false;
          if (w.serviceId && t.serviceId !== w.serviceId) return false;
          if (w.payerAddress && t.payerAddress.toLowerCase() !== w.payerAddress.toLowerCase()) return false;
          if (w.status && t.status !== w.status) return false;
          return true;
        });
      }
      // Sort newest first by default
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (params?.skip) list = list.slice(params.skip);
      if (params?.take) list = list.slice(0, params.take);
      return list.map((t) => ({ ...t }));
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newTx = {
        id,
        protocolVersion: "2.0",
        paymentScheme: "exact",
        status: "PENDING",
        isSimulated: false,
        createdAt: new Date(),
        ...data,
      };
      this.transactions.set(id, newTx);
      return { ...newTx };
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = this.transactions.get(where.id);
      if (!existing) throw new Error(`Transaction not found: ${where.id}`);
      const updated = { ...existing, ...data };
      this.transactions.set(where.id, updated);
      return { ...updated };
    },
    count: async (params?: { where?: any }) => {
      if (!params?.where) return this.transactions.size;
      const list = await this.paymentTransaction.findMany(params);
      return list.length;
    },
  };

  paymentAttempt = {
    findUnique: async ({ where }: { where: { id?: string; requestId?: string } }) => {
      if (where.id) return this.attempts.get(where.id) || null;
      for (const a of this.attempts.values()) {
        if (where.requestId && a.requestId === where.requestId) return { ...a };
      }
      return null;
    },
    findMany: async (params?: { where?: any; take?: number }) => {
      let list = Array.from(this.attempts.values());
      if (params?.where?.status) {
        list = list.filter((a) => a.status === params.where.status);
      }
      if (params?.take) list = list.slice(0, params.take);
      return list.map((a) => ({ ...a }));
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newAttempt = {
        id,
        status: "INITIATED",
        createdAt: new Date(),
        ...data,
      };
      this.attempts.set(id, newAttempt);
      return { ...newAttempt };
    },
    update: async ({ where, data }: { where: { id?: string; requestId?: string }; data: any }) => {
      let existing: any = null;
      let targetId = where.id;
      if (targetId) {
        existing = this.attempts.get(targetId);
      } else if (where.requestId) {
        for (const [k, v] of this.attempts.entries()) {
          if (v.requestId === where.requestId) {
            targetId = k;
            existing = v;
            break;
          }
        }
      }
      if (!existing || !targetId) return null;
      const updated = { ...existing, ...data };
      this.attempts.set(targetId, updated);
      return { ...updated };
    },
    count: async () => this.attempts.size,
  };

  apiUsage = {
    create: async ({ data }: { data: any }) => {
      const newUsage = {
        id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date(),
        ...data,
      };
      this.usages.push(newUsage);
      return { ...newUsage };
    },
    findMany: async (params?: { where?: any; take?: number }) => {
      let list = [...this.usages];
      if (params?.where?.serviceId) {
        list = list.filter((u) => u.serviceId === params.where.serviceId);
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (params?.take) list = list.slice(0, params.take);
      return list;
    },
    count: async () => this.usages.length,
  };

  auditLog = {
    create: async ({ data }: { data: any }) => {
      const newLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date(),
        ...data,
      };
      this.auditLogs.push(newLog);
      return { ...newLog };
    },
    findMany: async (params?: { take?: number }) => {
      const list = [...this.auditLogs];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (params?.take) return list.slice(0, params.take);
      return list;
    },
    count: async () => this.auditLogs.length,
  };
}

const memoryStore = new MemoryStorage();

export const db = memoryStore;
export const prisma = prismaInstance;
