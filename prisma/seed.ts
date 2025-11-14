import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Check if an admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists, skipping seeding.");
    return;
  }

  // 1️⃣ Create the first company

  // 2️⃣ Create the first admin account
  const hashedPassword = await bcrypt.hash("admin", 10); // Change password before deploy!

  const admin = await prisma.user.create({
    data: {
      userName: "admin",
      fullName: "Super Admin",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin account created:", admin.userName);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
