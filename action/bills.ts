"use server";

import { messageTranslation } from "@/lib/constant";
import { handleAction } from "@/lib/handleAction";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { BillType, InvoiceType, PaidType, Permission } from "@prisma/client";

interface ReceiptServiceData {
  invoiceNo: string;
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
      const { invoiceNo, items, type, companyId } = data;
      const createdBy = session.user.id;

      // Validate data
      if (!invoiceNo || !items?.length || !companyId) {
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

        return {
          ...bill,
          totalAmount: bill.totalAmount.toNumber(),
          vat: bill.vat.toNumber(),
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

export async function promoteBillToReceiptService(
  id: number,
  invoiceNo: string
) {
  return handleAction(
    async () => {
      const session = await requirePermission(Permission.SALE_INVOICE_UPDATE);
      const promotedBy = session.user.id;
      const bill = await prisma.receiptService.findUnique({
        where: { id: Number(id) },
      });
      if (!bill) throw new Error(messageTranslation.NotFound);
      if (bill.type !== BillType.BILL_SERVICE)
        throw new Error(messageTranslation.Unknown);
      const newInvoice = await prisma.receiptService.create({
        data: {
          companyId: bill.companyId,
          invoiceNo: invoiceNo,
          year: bill.year,
          month: bill.month,
          totalAmount: bill.totalAmount,
          billId: bill.id,
          type: BillType.RECEIPT_SERVICE, //
          vat: bill.vat ?? 0,
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

      const result = await prisma.$transaction(async (tx) => {
        // Get current receipt with relationships
        const currentReceipt = await tx.receiptService.findUnique({
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
          include: {
            saleInvoices: true,
          },
        });

        return {
          ...updatedReceipt,
          totalAmount: updatedReceipt!.totalAmount.toNumber(),
          vat: updatedReceipt!.vat.toNumber(),
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
