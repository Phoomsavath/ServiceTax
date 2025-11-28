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
      console.log("Prisma connected");
      return client;
    } catch (err) {
      console.log(`DB connect failed. Retry ${i + 1}/${retries}...`);
      await wait(delay);
    }
  }
  console.error("❌ Failed to connect to DB after retries.");
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
