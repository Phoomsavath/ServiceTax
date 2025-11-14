-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userName` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `activeStatus` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `currentToken` VARCHAR(191) NULL,
    `permissions` JSON NULL,
    `role` ENUM('ADMIN', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',

    UNIQUE INDEX `User_userName_key`(`userName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activeStatus` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `name` VARCHAR(191) NOT NULL,
    `descriptions` VARCHAR(191) NULL,
    `cost` DECIMAL(10, 2) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `unit` ENUM('CARS', 'FILES', 'PAGES', 'PERSON') NOT NULL DEFAULT 'FILES',
    `category` ENUM('OFFICER_SERVICE', 'TAX_SERVICE', 'DELIVERY', 'WAREHOUSE_SERVICE', 'GOVERNMENT_SERVICE', 'GOVERNMENT_VAT') NOT NULL DEFAULT 'WAREHOUSE_SERVICE',
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,

    UNIQUE INDEX `Service_name_category_key`(`name`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activeStatus` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `name` VARCHAR(191) NOT NULL,
    `taxNumber` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `managerContact` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaleInvoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `saleInvoiceNo` VARCHAR(191) NOT NULL,
    `deliveryPoint` VARCHAR(191) NOT NULL,
    `type` ENUM('QUOTATION', 'INVOICE') NOT NULL DEFAULT 'QUOTATION',
    `quotationId` INTEGER NULL,
    `paidStatus` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `netDate` DATETIME(3) NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `vat` DECIMAL(10, 2) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `billId` INTEGER NULL,
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,

    UNIQUE INDEX `SaleInvoice_saleInvoiceNo_key`(`saleInvoiceNo`),
    UNIQUE INDEX `SaleInvoice_quotationId_key`(`quotationId`),
    INDEX `SaleInvoice_type_idx`(`type`),
    INDEX `SaleInvoice_createdById_idx`(`createdById`),
    INDEX `SaleInvoice_saleInvoiceNo_idx`(`saleInvoiceNo`),
    INDEX `SaleInvoice_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaleInvoice_Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `vat` DECIMAL(10, 2) NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReceiptService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNo` VARCHAR(191) NOT NULL,
    `type` ENUM('BILL_SERVICE', 'RECEIPT_SERVICE') NOT NULL DEFAULT 'BILL_SERVICE',
    `companyId` INTEGER NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `vat` DECIMAL(10, 2) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `billId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,

    UNIQUE INDEX `ReceiptService_invoiceNo_key`(`invoiceNo`),
    UNIQUE INDEX `ReceiptService_billId_key`(`billId`),
    INDEX `ReceiptService_type_idx`(`type`),
    INDEX `ReceiptService_createdById_idx`(`createdById`),
    INDEX `ReceiptService_invoiceNo_idx`(`invoiceNo`),
    INDEX `ReceiptService_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice` ADD CONSTRAINT `SaleInvoice_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `SaleInvoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice` ADD CONSTRAINT `SaleInvoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice` ADD CONSTRAINT `SaleInvoice_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `ReceiptService`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice` ADD CONSTRAINT `SaleInvoice_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice` ADD CONSTRAINT `SaleInvoice_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice_Service` ADD CONSTRAINT `SaleInvoice_Service_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `SaleInvoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleInvoice_Service` ADD CONSTRAINT `SaleInvoice_Service_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptService` ADD CONSTRAINT `ReceiptService_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptService` ADD CONSTRAINT `ReceiptService_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `ReceiptService`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptService` ADD CONSTRAINT `ReceiptService_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptService` ADD CONSTRAINT `ReceiptService_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
