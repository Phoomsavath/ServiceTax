"use server";

import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { InvoiceType, PaidType, Permission } from "@prisma/client";

interface SaleInvoiceData {
  invoiceNo: string;
  companyId: number;
  status?: PaidType;
  type: InvoiceType;
  quotationId?: number;
  deliveryPoint: string;
  items: Array<{
    serviceId: number;
    quantity: number;
    price: number;
    cost: number;
  }>;
}

export async function createSaleInvoice(data: SaleInvoiceData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_CREATE);
      const {
        companyId,
        invoiceNo,
        items,
        status,
        type,
        quotationId,
        deliveryPoint,
      } = data;
      const createdBy = session.user.id;

      // Validate data
      if (!companyId || !invoiceNo || !items?.length || !status) {
        throw new Error(messageTranslation.AllFiledRequired);
      }

      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Calculate total amount
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create sale invoice
        const invoice = await tx.saleInvoice.create({
          data: {
            saleInvoiceNo: invoiceNo,
            companyId: companyId,
            year: year,
            month: month,
            totalAmount: totalAmount,
            paidStatus: status,
            createdById: createdBy,
            type: type,
            deliveryPoint: deliveryPoint, // Add default value or pass from data
            quotationId: quotationId,
            vat: 0, // Add default value or pass from data
          },
        });
        // 2. Create sale items (always create items regardless of status)
        await tx.saleInvoice_Service.createMany({
          data: data.items.map((item) => ({
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: item.price,
            cost: item.cost,
            vat: 0,
          })),
        });

        return {
          ...invoice,
          totalAmount: invoice.totalAmount.toNumber(),
          vat: invoice.vat.toNumber(),
        };
      });

      return result;
    },
    {
      successKey: messageTranslation.CreatedSuccess,
      errorKey: messageTranslation.CreateFailed,
    }
  );
}

export async function promoteQuotationToInvoice(
  id: number,
  invoiceNo: string,
  status: PaidType
) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_UPDATE);
      const promotedBy = session.user.id;
      const quotation = await prisma.saleInvoice.findUnique({
        where: { id: Number(id) },
      });
      if (!quotation) throw new Error(messageTranslation.NotFound);
      if (quotation.type !== InvoiceType.QUOTATION)
        throw new Error(messageTranslation.Unknown);
      const newInvoice = await prisma.saleInvoice.create({
        data: {
          saleInvoiceNo: invoiceNo,
          companyId: quotation.companyId,
          year: quotation.year,
          month: quotation.month,
          totalAmount: quotation.totalAmount,
          quotationId: quotation.id,
          paidStatus: status, //
          type: InvoiceType.INVOICE, //
          deliveryPoint: quotation.deliveryPoint,
          vat: quotation.vat ?? 0,
          createdById: promotedBy,
        },
      });
      return {
        ...newInvoice,
        totalAmount: newInvoice.totalAmount.toNumber(),
        vat: newInvoice.vat ? newInvoice.vat.toNumber() : 0,
      };
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
interface UpdateSaleInvoiceData {
  items: Array<{
    serviceId: number;
    quantity: number;
    price: number;
    cost: number;
  }>;
}

export async function updateSaleInvoice(
  id: number,
  data: UpdateSaleInvoiceData
) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_UPDATE);
      const updatedBy = session.user.id;
      const { items } = data;

      // Validate data
      if (!items?.length) {
        throw new Error(messageTranslation.AllFiledRequired);
      }

      // Calculate total amount
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      const result = await prisma.$transaction(async (tx) => {
        // Get current invoice with its relationships
        const currentInvoice = await tx.saleInvoice.findUnique({
          where: { id: Number(id) },
          include: {
            quotation: true, // Parent quotation if this is an invoice
            subSaleInvoices: true, // Child invoice if this is a quotation
          },
        });

        if (!currentInvoice) {
          throw new Error(messageTranslation.NotFound);
        }

        // Determine what needs to be updated
        const invoicesToUpdate: number[] = [currentInvoice.id];

        // If this record has a parent quotation, include it
        if (currentInvoice.quotationId) {
          invoicesToUpdate.push(currentInvoice.quotationId);
        }

        // If this record has a child invoice, include it
        if (currentInvoice.subSaleInvoices) {
          invoicesToUpdate.push(currentInvoice.subSaleInvoices.id);
        }

        // STEP 1: Delete all related service items for ALL affected records
        await tx.saleInvoice_Service.deleteMany({
          where: {
            invoiceId: {
              in: invoicesToUpdate,
            },
          },
        });

        // STEP 2: Update all affected invoices/quotations
        await tx.saleInvoice.updateMany({
          where: {
            id: {
              in: invoicesToUpdate,
            },
          },
          data: {
            totalAmount: totalAmount,
            updatedById: updatedBy,
          },
        });

        // STEP 3: Create new service items for ALL affected records
        const serviceItemsToCreate = invoicesToUpdate.flatMap((invoiceId) =>
          data.items.map((item) => ({
            invoiceId: invoiceId,
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: item.price,
            cost: item.cost,
            vat: 0,
          }))
        );

        await tx.saleInvoice_Service.createMany({
          data: serviceItemsToCreate,
        });

        // Fetch and return the updated primary invoice
        const updatedInvoice = await tx.saleInvoice.findUnique({
          where: { id: currentInvoice.id },
        });

        return {
          ...updatedInvoice,
          totalAmount: updatedInvoice!.totalAmount.toNumber(),
          vat: updatedInvoice!.vat.toNumber(),
        };
      });

      return result;
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}

export async function deleteSaleInvoice(id: number) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_DELETE);
      const quotation = await prisma.saleInvoice.findUnique({
        where: { id: id },
        select: { id: true, type: true, subSaleInvoices: true },
      });
      if (!quotation) throw new Error(messageTranslation.NotFound);
      if (quotation.type !== InvoiceType.QUOTATION)
        throw new Error(messageTranslation.DeleteFailed);
      if (quotation.subSaleInvoices)
        throw new Error(messageTranslation.Relationship);
      await prisma.saleInvoice.delete({
        where: {
          id: quotation.id,
        },
      });
    },
    {
      successKey: messageTranslation.DeletedSuccess,
      errorKey: messageTranslation.DeleteFailed,
    }
  );
}
