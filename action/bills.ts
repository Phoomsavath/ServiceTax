"use server";

import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { BillType, InvoiceType, PaidType, Permission } from "@prisma/client";

interface ReceiptServiceData {
  type: BillType;
  companyId: number;
  items: Array<{
    invoiceId: number;
    totalAmount: number;
  }>;
}

export async function createReceiptService(data: ReceiptServiceData) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_CREATE);
      const { items, type, companyId } = data;
      const createdBy = session.user.id;

      // Validate data
      if (!items?.length || !companyId) {
        throw new Error(messageTranslation.AllFiledRequired);
      }

      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Calculate total amount
      const totalAmount = data.items.reduce(
        (sum, item) => sum + Number(item.totalAmount || 0),
        0
      );
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, ""); // Format: YYYYMMDD
      const prefix = type === BillType.BILL_SERVICE ? "BL" : "RC";
      const todayCount = await prisma.receiptService.count({
        where: {
          type: type,
          createdAt: {
            gte: date,
            lt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Next day
          },
        },
      });

      const invoiceNo = `${prefix}${dateStr}-${todayCount + 1}`;

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create receipt service

        const bill = await tx.receiptService.create({
          data: {
            companyId: companyId,
            invoiceNo: invoiceNo,
            year: year,
            month: month,
            totalAmount: totalAmount,
            createdById: createdBy,
            type: type,
            vat: 0, // Add default value or pass from data
          },
          select: { id: true },
        });

        // 2. Update all sale invoices with the new billId
        await tx.saleInvoice.updateMany({
          where: {
            id: {
              in: data.items.map((item) => item.invoiceId),
            },
          },
          data: {
            billId: bill.id,
          },
        });

        return bill;
      });

      return result;
    },
    {
      successKey: messageTranslation.CreatedSuccess,
      errorKey: messageTranslation.CreateFailed,
    }
  );
}

export async function promoteBillToReceiptService(id: number) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_UPDATE);
      const promotedBy = session.user.id;

      const date = new Date();
      date.setUTCHours(0, 0, 0, 0); // Set to start of day for consistency

      const bill = await prisma.receiptService.findUnique({
        where: { id: Number(id) },
      });

      if (!bill) throw new Error(messageTranslation.NotFound);
      if (bill.type !== BillType.BILL_SERVICE)
        throw new Error(messageTranslation.Unknown);

      // 2. Generate invoice number
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      const prefix = "RC";

      const todayCount = await prisma.receiptService.count({
        where: {
          type: BillType.RECEIPT_SERVICE,
          createdAt: {
            gte: date,
            lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      const invoiceNo = `${prefix}${dateStr}-${todayCount + 1}`;

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Verify bill exists and is valid

        // 3. Create new receipt
        const newReceipt = await tx.receiptService.create({
          data: {
            companyId: bill.companyId,
            invoiceNo: invoiceNo,
            year: bill.year,
            month: bill.month,
            totalAmount: bill.totalAmount,
            billId: bill.id,
            type: BillType.RECEIPT_SERVICE,
            vat: bill.vat ?? 0,
            createdById: promotedBy,
          },
          select: { id: true },
        });

        // 4. Copy service items from bill to receipt

        return newReceipt;
      });

      return result;
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
interface UpdateReceiptServiceData {
  items: Array<{
    invoiceId: number;
    totalAmount: number;
  }>;
}

export async function updateReceiptService(
  id: number,
  data: UpdateReceiptServiceData
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
        (sum, item) => sum + Number(item.totalAmount || 0),
        0
      );
      const date = new Date();
      const currentReceipt = await prisma.receiptService.findUnique({
        where: { id: Number(id) },
        include: {
          saleInvoices: { select: { id: true } }, // Current linked invoices
          bill: true, // Parent bill if this is a sub-bill
          subBills: true, // Child bill if this is a parent
        },
      });

      if (!currentReceipt) {
        throw new Error(messageTranslation.NotFound);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Get current receipt with relationships

        // Determine which receipts need to be updated
        const receiptsToUpdate: number[] = [currentReceipt.id];

        // If this receipt has a parent bill, include it
        if (currentReceipt.billId) {
          receiptsToUpdate.push(currentReceipt.billId);
        }

        // If this receipt has a child bill, include it
        if (currentReceipt.subBills) {
          receiptsToUpdate.push(currentReceipt.subBills.id);
        }

        // STEP 1: Get ALL old invoice IDs linked to ANY of the receipts being updated
        const oldLinkedInvoices = await tx.saleInvoice.findMany({
          where: {
            billId: {
              in: receiptsToUpdate,
            },
          },
          select: { id: true },
        });

        const oldInvoiceIds = oldLinkedInvoices.map((inv) => inv.id);

        // STEP 2: Unlink ALL old invoices from ALL receipts
        if (oldInvoiceIds.length > 0) {
          await tx.saleInvoice.updateMany({
            where: {
              id: {
                in: oldInvoiceIds,
              },
            },
            data: {
              billId: null,
            },
          });
        }

        // STEP 3: Update all affected receipts/bills with new totals
        await tx.receiptService.updateMany({
          where: {
            id: {
              in: receiptsToUpdate,
            },
          },
          data: {
            totalAmount: totalAmount,
            updatedById: updatedBy,
            updatedAt: date,
          },
        });

        // STEP 4: Link new invoices to ALL affected receipts
        const newInvoiceIds = items.map((item) => item.invoiceId);

        // Link to each receipt that needs updating
        for (const receiptId of receiptsToUpdate) {
          await tx.saleInvoice.updateMany({
            where: {
              id: {
                in: newInvoiceIds,
              },
            },
            data: {
              billId: receiptId,
            },
          });
        }

        // Fetch and return the updated receipt
        const updatedReceipt = await tx.receiptService.findUnique({
          where: { id: currentReceipt.id },
          select: {
            id: true,
          },
        });
        if (!updatedReceipt) throw new Error(messageTranslation.NotFound);

        return updatedReceipt;
      });

      return result;
    },
    {
      successKey: messageTranslation.UpdatedSuccess,
      errorKey: messageTranslation.UpdateFailed,
    }
  );
}
