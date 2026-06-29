-- CreateEnum
CREATE TYPE "TipeTransaksi" AS ENUM ('RITEL', 'GROSIR');

-- CreateEnum
CREATE TYPE "StatusTransaksi" AS ENUM ('DRAFT', 'PAID', 'VOID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('TUNAI', 'TRANSFER', 'QRIS', 'KARTU');

-- CreateEnum
CREATE TYPE "StatusHargaKhusus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "JenisPergerakanStok" AS ENUM ('PENJUALAN', 'RETUR_PENJUALAN', 'PENERIMAAN_GRN', 'RETUR_PEMBELIAN', 'PENYESUAIAN_OPNAME', 'PENYESUAIAN_MANUAL');

-- CreateTable
CREATE TABLE "sesi_kasir" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modalAwal" DECIMAL(14,2) NOT NULL,
    "totalKasAkhir" DECIMAL(14,2),
    "dibukaPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ditutupPada" TIMESTAMP(3),
    "catatan" TEXT,

    CONSTRAINT "sesi_kasir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "kodeMember" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "email" TEXT,
    "alamat" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "catatan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harga_khusus" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "hargaKhusus" DECIMAL(14,2) NOT NULL,
    "tanggalMulai" TIMESTAMP(3),
    "tanggalBerakhir" TIMESTAMP(3),
    "status" "StatusHargaKhusus" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harga_khusus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harga_khusus_log" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "hargaLama" DECIMAL(14,2),
    "hargaBaru" DECIMAL(14,2) NOT NULL,
    "diubahOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harga_khusus_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "nomorTransaksi" TEXT NOT NULL,
    "tipeTransaksi" "TipeTransaksi" NOT NULL DEFAULT 'RITEL',
    "memberId" TEXT,
    "kasirId" TEXT NOT NULL,
    "sesiKasirId" TEXT NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "diskonTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "metodePembayaran" "MetodePembayaran",
    "jumlahDibayar" DECIMAL(14,2),
    "kembalian" DECIMAL(14,2),
    "status" "StatusTransaksi" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi_item" (
    "id" TEXT NOT NULL,
    "transaksiId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "qtyRetur" INTEGER NOT NULL DEFAULT 0,
    "hargaSatuan" DECIMAL(14,2) NOT NULL,
    "tipeHarga" TEXT NOT NULL,
    "diskonItem" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "transaksi_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kartu_stok" (
    "id" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jenisPergerakan" "JenisPergerakanStok" NOT NULL,
    "qty" INTEGER NOT NULL,
    "stokSebelum" INTEGER NOT NULL,
    "stokSesudah" INTEGER NOT NULL,
    "referensiTipe" TEXT NOT NULL,
    "referensiId" TEXT,
    "userId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kartu_stok_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_kodeMember_key" ON "member"("kodeMember");

-- CreateIndex
CREATE UNIQUE INDEX "member_noHp_key" ON "member"("noHp");

-- CreateIndex
CREATE UNIQUE INDEX "harga_khusus_memberId_produkId_status_key" ON "harga_khusus"("memberId", "produkId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_nomorTransaksi_key" ON "transaksi"("nomorTransaksi");

-- AddForeignKey
ALTER TABLE "sesi_kasir" ADD CONSTRAINT "sesi_kasir_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_khusus" ADD CONSTRAINT "harga_khusus_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_khusus" ADD CONSTRAINT "harga_khusus_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_khusus_log" ADD CONSTRAINT "harga_khusus_log_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_khusus_log" ADD CONSTRAINT "harga_khusus_log_diubahOlehId_fkey" FOREIGN KEY ("diubahOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_kasirId_fkey" FOREIGN KEY ("kasirId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_sesiKasirId_fkey" FOREIGN KEY ("sesiKasirId") REFERENCES "sesi_kasir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_item" ADD CONSTRAINT "transaksi_item_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "transaksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_item" ADD CONSTRAINT "transaksi_item_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kartu_stok" ADD CONSTRAINT "kartu_stok_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kartu_stok" ADD CONSTRAINT "kartu_stok_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
