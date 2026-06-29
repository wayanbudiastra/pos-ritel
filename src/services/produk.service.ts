import { prisma } from "@/lib/prisma";
import type { ProdukInput } from "@/validations/produk.schema";

// Dibatasi ke 100 data terakhir, lalu diurutkan alfabetis untuk ditampilkan;
// pencarian & paging 10/halaman dilakukan di client.
export async function listProduk() {
  const data = await prisma.produk.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { kategori: true },
  });
  return data.sort((a, b) => a.nama.localeCompare(b.nama));
}

export function getProduk(id: string) {
  return prisma.produk.findUnique({ where: { id } });
}

export function getProdukByBarcode(barcode: string) {
  return prisma.produk.findUnique({ where: { barcode } });
}

// PRD 5.5.5: barcode bisa diinput manual atau digenerate otomatis jika
// supplier tidak menyediakan barcode standar. Prefix "20" dipakai sesuai
// konvensi GS1 untuk kode internal toko (bukan barcode produk resmi).
async function generateInternalBarcode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const random = Math.floor(Math.random() * 10_000_000_000)
      .toString()
      .padStart(11, "0");
    const barcode = `20${random}`;
    const existing = await prisma.produk.findUnique({ where: { barcode } });
    if (!existing) return barcode;
  }
  throw new Error("Gagal membuat barcode otomatis, coba lagi.");
}

export async function createProduk(data: ProdukInput) {
  const barcode = data.barcode ?? (await generateInternalBarcode());
  return prisma.produk.create({
    data: {
      ...data,
      barcode,
    },
  });
}

export async function updateProduk(id: string, data: ProdukInput) {
  const barcode = data.barcode ?? (await generateInternalBarcode());
  return prisma.produk.update({
    where: { id },
    data: {
      ...data,
      barcode,
    },
  });
}

// Soft-delete (PRD US-08: produk dapat dinonaktifkan tanpa menghapus histori transaksi terkait).
export function nonaktifkanProduk(id: string) {
  return prisma.produk.update({ where: { id }, data: { aktif: false } });
}

export function aktifkanProduk(id: string) {
  return prisma.produk.update({ where: { id }, data: { aktif: true } });
}
