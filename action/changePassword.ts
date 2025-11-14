"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { handleAction } from "@/lib/handleAction";
import { getAuth, requirePermission } from "@/lib/requirePermission";
import { messageTranslation } from "@/lib/constant";
import { Permission } from "@prisma/client";

export async function changePassword(prevState: any, formData: FormData) {
  return handleAction(
    async () => {
      const newPassword = formData.get("newPassword") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const session = await getAuth();

      if (!newPassword || !confirmPassword)
        throw Error(messageTranslation.UpdateFailed);

      if (newPassword !== confirmPassword) return;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, password: true },
      });
      if (!user) throw new Error(messageTranslation.NotFound);

      const hashed = await bcrypt.hash(newPassword, 10);
      return await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}

export async function resetPassword(id: number, newPassword: string) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.USER_UPDATE);
      const isAdmin = session.user.role;
      if (!isAdmin) throw new Error(messageTranslation.AdminOnly);

      const hashed = await bcrypt.hash(newPassword, 10);
      return await prisma.user.update({
        where: { id: Number(id) },
        data: { password: hashed },
      });
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
