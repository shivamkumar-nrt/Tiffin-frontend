-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "price_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tiffinType" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "effectiveTo" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "combo_packages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tiffinType" TEXT NOT NULL DEFAULT 'FULL',
    "price" DECIMAL NOT NULL,
    "description" TEXT,
    "includedItems" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "menus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceDate" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menuId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isSpicy" BOOLEAN NOT NULL DEFAULT false,
    "isSweet" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tiffin_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "tiffinType" TEXT NOT NULL,
    "specialInstructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tiffin_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tiffin_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "tiffinType" TEXT NOT NULL,
    "menuSnapshot" TEXT,
    "chargedAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tiffin_records_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "tiffin_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tiffin_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tiffin_records_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionRef" TEXT,
    "paymentDate" DATETIME,
    "paymentApp" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "billingStartDate" DATETIME NOT NULL,
    "billingEndDate" DATETIME NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "paymentAmount" DECIMAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
    "notes" TEXT,
    "generatedBy" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "tiffinRecordId" INTEGER NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "tiffinType" TEXT NOT NULL,
    "menuSummary" TEXT,
    "chargedAmount" DECIMAL NOT NULL,
    CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoice_items_tiffinRecordId_fkey" FOREIGN KEY ("tiffinRecordId") REFERENCES "tiffin_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT,
    "performedBy" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "broadcast_notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "targetUserId" INTEGER,
    "targetUserName" TEXT,
    "channels" TEXT,
    "sentBy" TEXT,
    "recipientsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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

