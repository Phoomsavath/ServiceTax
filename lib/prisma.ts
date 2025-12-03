import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(
  client: PrismaClient,
  retries = 10,
  delay = 1500
) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.$connect();
      return client;
    } catch (err) {
      await wait(delay);
    }
  }
  return client; // ปล่อยต่อ แต่จะ error ถ้าถาม DB จริง ๆ
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

connectWithRetry(prisma);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
