# ------------------------
# 1) Base image
# ------------------------
FROM node:20-alpine AS base
WORKDIR /app

# เปิดใช้งาน pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ------------------------
# 2) Install dependencies
# ------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ------------------------
# 3) Build stage
# ------------------------
FROM base AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN pnpm build

# ------------------------
# 4) Production runner
# ------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["pnpm", "start"]
