/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNo,type]` on the table `ReceiptService` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saleInvoiceNo,type]` on the table `SaleInvoice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `ReceiptService_invoiceNo_key` ON `receiptservice`;

-- DropIndex
DROP INDEX `SaleInvoice_saleInvoiceNo_key` ON `saleinvoice`;

-- CreateIndex
CREATE UNIQUE INDEX `ReceiptService_invoiceNo_type_key` ON `ReceiptService`(`invoiceNo`, `type`);

-- CreateIndex
CREATE UNIQUE INDEX `SaleInvoice_saleInvoiceNo_type_key` ON `SaleInvoice`(`saleInvoiceNo`, `type`);
