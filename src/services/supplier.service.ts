import { prisma } from "@/lib/prisma";
import type { SupplierInput } from "@/validations/supplier.schema";

// Dibatasi ke 100 data terakhir, lalu diurutkan alfabetis untuk ditampilkan;
// pencarian & paging 10/halaman dilakukan di client.
export async function listSupplier() {
  const data = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return data.sort((a, b) => a.nama.localeCompare(b.nama));
}

export function createSupplier(data: SupplierInput) {
  return prisma.supplier.create({ data });
}

export function updateSupplier(id: string, data: SupplierInput) {
  return prisma.supplier.update({ where: { id }, data });
}

export function nonaktifkanSupplier(id: string) {
  return prisma.supplier.update({ where: { id }, data: { aktif: false } });
}

export function aktifkanSupplier(id: string) {
  return prisma.supplier.update({ where: { id }, data: { aktif: true } });
}
