"use server";

import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";

import { ActiveState, Permission, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function createUser(prevState: any, data: FormData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.USER_CREATE);

      const userName = data.get("userName")?.toString();

      const fullName = data.get("fullName")?.toString();
      const password = data.get("password")?.toString();
      const role = data.get("role")?.toString();
      const permissionsString = data.get("permissions")?.toString();
      if (session.user.role !== Role.ADMIN && Role.ADMIN === role)
        throw new Error(messageTranslation.Forbidden);

      if (!userName || !password || !role)
        throw new Error(messageTranslation.AllFiledRequired);

      // Parse permissions from JSON string
      let permissions: Permission[] = [];
      if (permissionsString) {
        try {
          permissions = JSON.parse(permissionsString);
        } catch (error) {
          throw new Error(messageTranslation.Unknown);
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      return await prisma.user.create({
        data: {
          userName: userName,
          password: hashedPassword,
          fullName: fullName,
          role: role as Role,
          permissions: permissions, // This will be stored as JSON in the database
        },
      });
    },
    {
      successKey: messageTranslation.CreatedSuccess,
      errorKey: messageTranslation.CreateFailed,
    }
  );
}
export async function updateUser(prevState: any, data: FormData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.USER_UPDATE);
      const id = data.get("id");
      const userName = data.get("userName")?.toString();
      const fullName = data.get("fullName")?.toString();
      const role = data.get("role")?.toString();
      const permissionsString = data.get("permissions")?.toString();
      if (!id || !userName || !role)
        throw new Error(messageTranslation.AllFiledRequired);

      // Parse permissions
      if (session.user.role !== Role.ADMIN && Role.ADMIN === role)
        throw new Error(messageTranslation.Forbidden);
      let permissions: Permission[] = [];
      if (permissionsString) {
        try {
          permissions = JSON.parse(permissionsString);
        } catch (error) {
          throw new Error(messageTranslation.AllFiledRequired);
        }
      }

      return await prisma.user.update({
        where: { id: Number(id) },
        data: {
          userName,
          fullName,
          role: role as Role,
          permissions, // Update permissions
        },
      });
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}

export async function updateActiveUser(id: number, status: ActiveState) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.USER_DELETE);
      await prisma.user.update({
        where: { id: Number(id) },
        data: { activeStatus: status },
      });
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
