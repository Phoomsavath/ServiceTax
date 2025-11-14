// lib/auth/requirePermission.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Permission, Role } from "@prisma/client";
import { messageTranslation } from "./constant";

export async function requirePermission(...requiredPermissions: Permission[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error(messageTranslation.Unauthorized);
  }
  const userRole = session.user?.role;
  if (userRole === Role.ADMIN) {
    return session;
  }

  const userPermissions = (session.user?.permissions as Permission[]) || [];

  const hasAllPermissions = requiredPermissions.every((perm) =>
    userPermissions.includes(perm)
  );

  if (!hasAllPermissions) {
    throw new Error(messageTranslation.Forbidden);
  }

  return session;
}

export async function getAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error(messageTranslation.Unauthorized);
  }
  return session;
}
