-- CreateEnum
CREATE TYPE "TipeAkun" AS ENUM ('ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'BEBAN', 'HPP');

-- CreateEnum
CREATE TYPE "SaldoNormal" AS ENUM ('DEBIT', 'KREDIT');

-- CreateEnum
CREATE TYPE "SumberJurnal" AS ENUM ('OTOMATIS', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusJurnal" AS ENUM ('POSTED', 'DIBATALKAN');

-- CreateTable
CREATE TABLE "akun" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "TipeAkun" NOT NULL,
    "saldoNormal" "SaldoNormal" NOT NULL,
    "indukAkunId" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "akun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemetaan_akun" (
    "id" TEXT NOT NULL,
    "kunci" TEXT NOT NULL,
    "akunId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemetaan_akun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurnal_entry" (
    "id" TEXT NOT NULL,
    "nomorJurnal" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT NOT NULL,
    "sumber" "SumberJurnal" NOT NULL,
    "eventLogId" TEXT,
    "dibuatOlehId" TEXT NOT NULL,
    "status" "StatusJurnal" NOT NULL DEFAULT 'POSTED',
    "jurnalPembalikDariId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jurnal_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurnal_line" (
    "id" TEXT NOT NULL,
    "jurnalEntryId" TEXT NOT NULL,
    "akunId" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "kredit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "keterangan" TEXT,

    CONSTRAINT "jurnal_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "akun_kode_key" ON "akun"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "pemetaan_akun_kunci_key" ON "pemetaan_akun"("kunci");

-- CreateIndex
CREATE UNIQUE INDEX "jurnal_entry_nomorJurnal_key" ON "jurnal_entry"("nomorJurnal");

-- CreateIndex
CREATE UNIQUE INDEX "jurnal_entry_eventLogId_key" ON "jurnal_entry"("eventLogId");

-- CreateIndex
CREATE UNIQUE INDEX "jurnal_entry_jurnalPembalikDariId_key" ON "jurnal_entry"("jurnalPembalikDariId");

-- AddForeignKey
ALTER TABLE "akun" ADD CONSTRAINT "akun_indukAkunId_fkey" FOREIGN KEY ("indukAkunId") REFERENCES "akun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemetaan_akun" ADD CONSTRAINT "pemetaan_akun_akunId_fkey" FOREIGN KEY ("akunId") REFERENCES "akun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurnal_entry" ADD CONSTRAINT "jurnal_entry_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurnal_entry" ADD CONSTRAINT "jurnal_entry_jurnalPembalikDariId_fkey" FOREIGN KEY ("jurnalPembalikDariId") REFERENCES "jurnal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurnal_line" ADD CONSTRAINT "jurnal_line_jurnalEntryId_fkey" FOREIGN KEY ("jurnalEntryId") REFERENCES "jurnal_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurnal_line" ADD CONSTRAINT "jurnal_line_akunId_fkey" FOREIGN KEY ("akunId") REFERENCES "akun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
