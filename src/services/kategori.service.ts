import { prisma } from "@/lib/prisma";
import type { KategoriInput } from "@/validations/kategori.schema";

// Dibatasi ke 100 data terakhir (paling baru dibuat), lalu diurutkan alfabetis
// untuk ditampilkan; pencarian & paging 10/halaman dilakukan di client (lihat
// kategori-table.tsx).
export async function listKategori() {
  const data = await prisma.kategori.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { produk: true } } },
  });
  return data.sort((a, b) => a.nama.localeCompare(b.nama));
}

export function createKategori(data: KategoriInput) {
  return prisma.kategori.create({ data });
}

export function updateKategori(id: string, data: KategoriInput) {
  return prisma.kategori.update({ where: { id }, data });
}

export async function deleteKategori(id: string) {
  const used = await prisma.produk.count({ where: { kategoriId: id } });
  if (used > 0) {
    throw new Error(
      `Kategori tidak dapat dihapus karena masih digunakan oleh ${used} produk.`,
    );
  }
  return prisma.kategori.delete({ where: { id } });
}
