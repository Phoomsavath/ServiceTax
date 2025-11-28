"use server";
import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { ActiveState, Category, Permission, Unit } from "@prisma/client";

interface serviceData {
  sets?: string[];
  name: string;
  cost: number;
  category: Category;
  price: number;
  warehouseIds: number[]; // Added this field
  unit: Unit;
  descriptions?: string;
}

export async function createService(data: serviceData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SERVICE_CREATE);
      const { name, cost, category, descriptions, price, unit, sets } = data;

      if (!name || !cost || !category || !price || !unit)
        throw new Error(messageTranslation.AllFiledRequired);

      const svc = await prisma.service.create({
        data: {
          name,
          descriptions,
          category,
          cost,
          sets,
          price,
          unit,
          createdById: Number(session.user.id),
        },
      });
      return {
        ...svc,
        cost: svc.cost.toNumber(),
        price: svc.price.toNumber(),
      };
    },
    {
      successKey: messageTranslation.CreatedSuccess,
      errorKey: messageTranslation.CreateFailed,
    }
  );
}

export async function updateService(id: number, data: serviceData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SERVICE_UPDATE);

      const { name, cost, category, price, unit, descriptions, sets } = data;
      if (!name || !cost || !category || !price || !unit)
        throw new Error(messageTranslation.AllFiledRequired);

      const svc = await prisma.service.update({
        where: { id: Number(id) },
        data: {
          name,
          sets,
          descriptions,
          category,
          cost,
          price,
          unit,
          updatedById: Number(session.user.id),
        },
      });
      return {
        ...svc,
        cost: svc.cost.toNumber(),
        price: svc.price.toNumber(),
      };
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
export async function updateActiveService(id: number, status: ActiveState) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SERVICE_DELETE);
      const update = await prisma.service.update({
        where: { id: Number(id) },
        data: { activeStatus: status },
        select: { id: true },
      });
      return update;
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
