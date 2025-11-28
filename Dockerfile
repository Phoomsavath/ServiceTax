# ------------------------
# 1) Base
# ------------------------
FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

# ------------------------
# 2) Install dependencies
# ------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ------------------------
# 3) Build
# ------------------------
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npx prisma generate
RUN pnpm build

# ------------------------
# 4) Production Runner
# ------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh
EXPOSE 3000

CMD ["pnpm", "start"]
