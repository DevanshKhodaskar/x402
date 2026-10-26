# ------------------------------------------------------------------------------
# Production Dockerfile for AgentPay (Next.js 15 Standalone)
# ------------------------------------------------------------------------------

# Stage 1: Base & Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.33.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build Next.js
RUN pnpm db:generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node", "./node_modules/next/dist/bin/next", "start", "-p", "3000"]
