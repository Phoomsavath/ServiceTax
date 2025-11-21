"use server";

import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { InvoiceType, PaidType, Permission } from "@prisma/client";

interface SaleInvoiceData {
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
    details?: string;
  }>;
}

export async function createSaleInvoice(data: SaleInvoiceData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_CREATE);
      const { companyId, items, status, type, quotationId, deliveryPoint } =
        data;
      const createdBy = session.user.id;

      // Validate data
      if (!companyId || !items?.length || !status) {
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
        // Generate invoice number based on type
        const dateStr = date.toISOString().split("T")[0].replace(/-/g, ""); // Format: YYYYMMDD
        const prefix = type === InvoiceType.INVOICE ? "IN" : "QU";

        // Get the count of invoices/quotations created today with the same type
        const todayCount = await tx.saleInvoice.count({
          where: {
            type: type,
            createdAt: {
              gte: date,
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Next day
            },
          },
        });

        const invoiceNo = `${prefix}${dateStr}-${todayCount + 1}`;

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
            deliveryPoint: deliveryPoint,
            quotationId: quotationId,
            vat: 0,
          },
          select: { id: true },
        });

        // 2. Create sale items (always create items regardless of status)
        await tx.saleInvoice_Service.createMany({
          data: data.items.map((item) => ({
            invoiceId: invoice.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: item.price,
            cost: item.cost,
            details: item.details,
            vat: 0,
          })),
        });

        return invoice;
      });

      return result;
    },
    {
      successKey: messageTranslation.CreatedSuccess,
      errorKey: messageTranslation.CreateFailed,
    }
  );
}

export async function promoteQuotationToInvoice(id: number, status: PaidType) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_UPDATE);
      const promotedBy = session.user.id;

      const date = new Date();
      date.setUTCHours(0, 0, 0, 0); // Set to start of day for consistency

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Verify quotation exists and is valid
        const quotation = await tx.saleInvoice.findUnique({
          where: { id: Number(id) },
        });

        if (!quotation) throw new Error(messageTranslation.NotFound);
        if (quotation.type !== InvoiceType.QUOTATION)
          throw new Error(messageTranslation.Unknown);

        // 2. Generate invoice number
        const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
        const prefix = "IN";

        const todayCount = await tx.saleInvoice.count({
          where: {
            type: InvoiceType.INVOICE,
            createdAt: {
              gte: date,
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        const invoiceNo = `${prefix}${dateStr}-${todayCount + 1}`;

        // 3. Create new invoice
        const newInvoice = await tx.saleInvoice.create({
          data: {
            saleInvoiceNo: invoiceNo,
            companyId: quotation.companyId,
            year: quotation.year,
            month: quotation.month,
            totalAmount: quotation.totalAmount,
            quotationId: quotation.id,
            paidStatus: status,
            type: InvoiceType.INVOICE,
            deliveryPoint: quotation.deliveryPoint,
            vat: quotation.vat ?? 0,
            createdById: promotedBy,
          },
          select: { id: true },
        });

        // 4. Copy service items from quotation to invoice

        return newInvoice;
      });

      return result;
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
    details?: string;
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
      const date = new Date();
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
            updatedAt: date,
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
            details: item.details,
            vat: 0,
          }))
        );

        await tx.saleInvoice_Service.createMany({
          data: serviceItemsToCreate,
        });

        // Fetch and return the updated primary invoice
        const updatedInvoice = await tx.saleInvoice.findUnique({
          where: { id: currentInvoice.id },
          select: { id: true },
        });

        return updatedInvoice;
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
