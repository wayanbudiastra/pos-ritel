-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SALE_COMPLETED', 'PURCHASE_RECEIVED', 'STOCK_ADJUSTED', 'PURCHASE_PAID');

-- CreateTable
CREATE TABLE "event_log" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "referensiId" TEXT NOT NULL,
    "diprosesAkuntansi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ringkasan_penjualan_harian" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "totalRitel" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalGrosir" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalKhusus" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPenjualan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalModal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDiskon" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalTransaksi" INTEGER NOT NULL DEFAULT 0,
    "totalQtyTerjual" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ringkasan_penjualan_harian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ringkasan_penjualan_harian_tanggal_key" ON "ringkasan_penjualan_harian"("tanggal");
