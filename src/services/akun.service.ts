import { prisma } from "@/lib/prisma";
import type { AkunInput } from "@/validations/akun.schema";

// Dibatasi ke 100 data terakhir, diurutkan berdasarkan kode (urutan COA wajar);
// pencarian & paging 10/halaman dilakukan di client.
export async function listAkun() {
  const data = await prisma.akun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { indukAkun: true },
  });
  return data.sort((a, b) => a.kode.localeCompare(b.kode));
}

export function getAkun(id: string) {
  return prisma.akun.findUnique({ where: { id } });
}

export function createAkun(data: AkunInput) {
  return prisma.akun.create({ data });
}

export function updateAkun(id: string, data: AkunInput) {
  return prisma.akun.update({ where: { id }, data });
}

// PRD akuntansi.md 5.1.3: tidak dapat dinonaktifkan jika masih dipakai
// sebagai mapping aktif di PemetaanAkun.
export async function nonaktifkanAkun(id: string) {
  const dipakai = await prisma.pemetaanAkun.findFirst({ where: { akunId: id } });
  if (dipakai) {
    throw new Error(
      `Akun tidak dapat dinonaktifkan karena masih dipakai sebagai Pemetaan Akun ("${dipakai.kunci}").`
    );
  }
  return prisma.akun.update({ where: { id }, data: { aktif: false } });
}

export function aktifkanAkun(id: string) {
  return prisma.akun.update({ where: { id }, data: { aktif: true } });
}
