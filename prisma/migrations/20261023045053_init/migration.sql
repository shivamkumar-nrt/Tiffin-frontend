-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ROLE_ADMIN', 'ROLE_EMPLOYEE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TiffinType" AS ENUM ('FULL', 'HALF');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('UNPAID', 'BILLED_PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_VERIFICATION', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('MAIN_COURSE', 'CURRY', 'BREAD', 'RICE', 'DESSERT', 'SALAD', 'BEVERAGE', 'SPECIAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "department" VARCHAR(100),
    "role" "RoleType" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_configs" (
    "id" SERIAL NOT NULL,
    "tiffinType" "TiffinType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_packages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tiffinType" "TiffinType" NOT NULL DEFAULT 'FULL',
    "price" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(500),
    "includedItems" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "serviceDate" DATE NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "description" VARCHAR(255),
    "isSpicy" BOOLEAN NOT NULL DEFAULT false,
    "isSweet" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiffin_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceDate" DATE NOT NULL,
    "tiffinType" "TiffinType" NOT NULL,
    "specialInstructions" VARCHAR(500),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" VARCHAR(100),
    "rejectionReason" VARCHAR(500),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiffin_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiffin_records" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceDate" DATE NOT NULL,
    "tiffinType" "TiffinType" NOT NULL,
    "menuSnapshot" VARCHAR(1000),
    "chargedAmount" DECIMAL(10,2) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiffin_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "paymentNumber" VARCHAR(50) NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionRef" VARCHAR(100),
    "paymentDate" DATE,
    "paymentApp" VARCHAR(100),
    "notes" VARCHAR(500),
    "rejectionReason" VARCHAR(500),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedBy" VARCHAR(100),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "userId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "billingStartDate" DATE NOT NULL,
    "billingEndDate" DATE NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'SUCCESS',
    "notes" VARCHAR(500),
    "generatedBy" VARCHAR(100),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "tiffinRecordId" INTEGER NOT NULL,
    "serviceDate" DATE NOT NULL,
    "tiffinType" "TiffinType" NOT NULL,
    "menuSummary" VARCHAR(500),
    "chargedAmount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entityName" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(50),
    "performedBy" VARCHAR(100) NOT NULL,
    "details" VARCHAR(1000),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_notifications" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "targetAudience" VARCHAR(50) NOT NULL,
    "targetUserId" INTEGER,
    "targetUserName" VARCHAR(100),
    "channels" VARCHAR(100),
    "sentBy" VARCHAR(100),
    "recipientsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "price_configs_tiffinType_isActive_idx" ON "price_configs"("tiffinType", "isActive");

-- CreateIndex
CREATE INDEX "combo_packages_isActive_idx" ON "combo_packages"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "menus_serviceDate_key" ON "menus"("serviceDate");

-- CreateIndex
CREATE INDEX "menu_items_menuId_idx" ON "menu_items"("menuId");

-- CreateIndex
CREATE INDEX "tiffin_requests_userId_serviceDate_idx" ON "tiffin_requests"("userId", "serviceDate");

-- CreateIndex
CREATE INDEX "tiffin_requests_status_idx" ON "tiffin_requests"("status");

-- CreateIndex
CREATE INDEX "tiffin_requests_serviceDate_idx" ON "tiffin_requests"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "tiffin_records_requestId_key" ON "tiffin_records"("requestId");

-- CreateIndex
CREATE INDEX "tiffin_records_userId_serviceDate_idx" ON "tiffin_records"("userId", "serviceDate");

-- CreateIndex
CREATE INDEX "tiffin_records_status_idx" ON "tiffin_records"("status");

-- CreateIndex
CREATE INDEX "tiffin_records_serviceDate_idx" ON "tiffin_records"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentNumber_key" ON "payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentId_key" ON "invoices"("paymentId");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_tiffinRecordId_key" ON "invoice_items"("tiffinRecordId");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "broadcast_notifications_createdAt_idx" ON "broadcast_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiffin_requests" ADD CONSTRAINT "tiffin_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiffin_records" ADD CONSTRAINT "tiffin_records_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "tiffin_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiffin_records" ADD CONSTRAINT "tiffin_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiffin_records" ADD CONSTRAINT "tiffin_records_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_tiffinRecordId_fkey" FOREIGN KEY ("tiffinRecordId") REFERENCES "tiffin_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
