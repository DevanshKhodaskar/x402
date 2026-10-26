# AgentPay Deployment Guide

This guide covers deploying AgentPay across local development, containerized environments, and production platforms like Vercel with managed PostgreSQL.

---

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **Package Manager**: `pnpm` v10+ (or `npm`)
- **Docker & Docker Compose** (optional for containerized deployment)
- **PostgreSQL**: v15+ (optional; an in-memory resilient fallback is built-in for zero-dependency local development)

---

## 2. Zero-Dependency Local Setup (Recommended)

AgentPay runs out of the box without requiring external Docker or PostgreSQL instances:

```bash
# 1. Clone repository and install dependencies
cd c:\Users\manty\Desktop\X402
pnpm install

# 2. Copy environment configuration
cp .env.example .env.local

# 3. Generate Prisma client types
pnpm db:generate

# 4. Run automated tests
pnpm test

# 5. Start development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Containerized Deployment (Docker Compose)

To run AgentPay alongside a live PostgreSQL container:

```bash
# Start PostgreSQL and AgentPay containers
docker compose up -d --build

# Run database migrations and seed
docker compose exec agentpay-web pnpm db:push
docker compose exec agentpay-web pnpm db:seed

# Inspect logs
docker compose logs -f agentpay-web
```

---

## 4. Production Cloud Deployment (Vercel + Neon / Supabase)

1. **Database Setup**:
   - Provision a PostgreSQL database on Neon, Supabase, or AWS RDS.
   - Copy the connection string to `DATABASE_URL`.
2. **Environment Variables**:
   - Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `X402_MODE=simulated` (or `testnet`).
   - If using Mode B, provide `FACILITATOR_PRIVATE_KEY` and `BASE_SEPOLIA_RPC`.
3. **Build & Deploy**:
   - Push to GitHub repository.
   - Connect repository in Vercel.
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
