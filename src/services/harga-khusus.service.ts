import { prisma } from "@/lib/prisma";
import type { HargaKhususInput } from "@/validations/harga-khusus.schema";

// Dipakai di POS untuk preview harga khusus yang berlaku saat ini bagi member terpilih.
export async function listHargaKhususAktif(memberId: string) {
  const now = new Date();
  const list = await prisma.hargaKhusus.findMany({
    where: { memberId, status: "AKTIF" },
  });
  return list.filter(
    (h) =>
      (!h.tanggalMulai || h.tanggalMulai <= now) &&
      (!h.tanggalBerakhir || h.tanggalBerakhir >= now),
  );
}

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listHargaKhususByMember(memberId: string) {
  return prisma.hargaKhusus.findMany({
    where: { memberId },
    include: { produk: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function listHargaKhususLog(memberId: string) {
  return prisma.hargaKhususLog.findMany({
    where: { memberId },
    include: { diubahOleh: { select: { nama: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// PRD 5.2.5: kombinasi (memberId + produkId) unik untuk status AKTIF.
export async function upsertHargaKhusus(
  memberId: string,
  data: HargaKhususInput,
  diubahOlehId: string,
) {
  const existing = await prisma.hargaKhusus.findFirst({
    where: { memberId, produkId: data.produkId, status: "AKTIF" },
  });

  const payload = {
    memberId,
    produkId: data.produkId,
    hargaKhusus: data.hargaKhusus,
    tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : null,
    tanggalBerakhir: data.tanggalBerakhir
      ? new Date(data.tanggalBerakhir)
      : null,
    catatan: data.catatan,
  };

  const result = existing
    ? await prisma.hargaKhusus.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.hargaKhusus.create({ data: payload });

  await prisma.hargaKhususLog.create({
    data: {
      memberId,
      produkId: data.produkId,
      hargaLama: existing?.hargaKhusus,
      hargaBaru: data.hargaKhusus,
      diubahOlehId,
    },
  });

  return result;
}

export async function nonaktifkanHargaKhusus(id: string, diubahOlehId: string) {
  const existing = await prisma.hargaKhusus.findUnique({ where: { id } });
  if (!existing) return null;

  const result = await prisma.hargaKhusus.update({
    where: { id },
    data: { status: "NONAKTIF" },
  });

  await prisma.hargaKhususLog.create({
    data: {
      memberId: existing.memberId,
      produkId: existing.produkId,
      hargaLama: existing.hargaKhusus,
      hargaBaru: existing.hargaKhusus,
      diubahOlehId,
    },
  });

  return result;
}
