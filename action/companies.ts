"use server";
import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { ActiveState, Permission } from "@prisma/client";

interface CompanyData {
  name: string;
  phone: string;
  address: string;
  email: string;
  taxNumber: string;
  managerContact: string;
}

export async function createCompany(data: CompanyData) {
  return handleAction(
    async () => {
      await requirePermission(Permission.COMPANY_CREATE);
      const { name, phone, address, email, taxNumber, managerContact } = data;
      if (!name || !phone || !address || !email || !taxNumber)
        throw new Error(messageTranslation.AllFiledRequired);
      return await prisma.company.create({
        data: {
          name: name,
          taxNumber: taxNumber,
          email: email,
          phone: phone,
          address: address,
          managerContact: managerContact,
        },
      });
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdatedSuccess,
    }
  );
}
export async function updateCompany(id: number, data: CompanyData) {
  return handleAction(
    async () => {
      await requirePermission(Permission.COMPANY_UPDATE);
      const { name, phone, address, email, taxNumber, managerContact } = data;
      if (!name || !phone || !address || !email || !taxNumber)
        throw new Error(messageTranslation.AllFiledRequired);
      return await prisma.company.update({
        where: { id: Number(id) },
        data: {
          name: name,
          taxNumber: taxNumber,
          email: email,
          phone: phone,
          address: address,
          managerContact: managerContact,
        },
      });
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
export async function updateActiveCompany(id: number, status: ActiveState) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.COMPANY_DELETE);
      await prisma.company.update({
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
