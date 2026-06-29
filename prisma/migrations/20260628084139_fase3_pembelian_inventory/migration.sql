-- CreateEnum
CREATE TYPE "StatusPO" AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'SEBAGIAN_DITERIMA', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusStokOpname" AS ENUM ('DRAFT', 'MENUNGGU_APPROVAL', 'SELESAI');

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" TEXT NOT NULL,
    "nomorPO" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "totalNilai" DECIMAL(14,2) NOT NULL,
    "status" "StatusPO" NOT NULL DEFAULT 'DRAFT',
    "disetujuiPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_item" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "qtyPesan" INTEGER NOT NULL,
    "hargaBeli" DECIMAL(14,2) NOT NULL,
    "qtyDiterima" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "po_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn" (
    "id" TEXT NOT NULL,
    "nomorGRN" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "diterimaOlehId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_item" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "qtyDiterima" INTEGER NOT NULL,
    "qtyDitolak" INTEGER NOT NULL DEFAULT 0,
    "hargaAktual" DECIMAL(14,2) NOT NULL,
    "nomorBatch" TEXT,
    "tanggalExpired" TIMESTAMP(3),
    "adaDiskrepansi" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "grn_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_opname" (
    "id" TEXT NOT NULL,
    "nomorOpname" TEXT NOT NULL,
    "lingkup" TEXT NOT NULL,
    "status" "StatusStokOpname" NOT NULL DEFAULT 'DRAFT',
    "dibuatOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selesaiPada" TIMESTAMP(3),

    CONSTRAINT "stok_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_opname_item" (
    "id" TEXT NOT NULL,
    "stokOpnameId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "stokSistem" INTEGER NOT NULL,
    "stokFisik" INTEGER,
    "selisih" INTEGER,
    "alasanKode" TEXT,

    CONSTRAINT "stok_opname_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_nomorPO_key" ON "purchase_order"("nomorPO");

-- CreateIndex
CREATE UNIQUE INDEX "grn_nomorGRN_key" ON "grn"("nomorGRN");

-- CreateIndex
CREATE UNIQUE INDEX "stok_opname_nomorOpname_key" ON "stok_opname"("nomorOpname");

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_item" ADD CONSTRAINT "po_item_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_item" ADD CONSTRAINT "po_item_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn" ADD CONSTRAINT "grn_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn" ADD CONSTRAINT "grn_diterimaOlehId_fkey" FOREIGN KEY ("diterimaOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_item" ADD CONSTRAINT "grn_item_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "grn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_item" ADD CONSTRAINT "grn_item_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_opname" ADD CONSTRAINT "stok_opname_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_opname_item" ADD CONSTRAINT "stok_opname_item_stokOpnameId_fkey" FOREIGN KEY ("stokOpnameId") REFERENCES "stok_opname"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_opname_item" ADD CONSTRAINT "stok_opname_item_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
