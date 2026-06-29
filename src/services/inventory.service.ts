import { prisma } from "@/lib/prisma";

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listKartuStok(produkId: string) {
  return prisma.kartuStok.findMany({
    where: { produkId },
    include: { user: { select: { nama: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// PRD 5.5.3: produk dengan stok <= stokMinimum, terurut berdasarkan urgensi.
export async function listProdukReorder() {
  const produkList = await prisma.produk.findMany({
    where: { aktif: true },
    include: { kategori: true },
  });
  return produkList
    .filter((p) => p.stok <= p.stokMinimum)
    .sort(
      (a, b) =>
        a.stok / Math.max(a.stokMinimum, 1) -
        b.stok / Math.max(b.stokMinimum, 1),
    );
}

export async function penyesuaianManual(
  produkId: string,
  qty: number,
  alasan: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const produk = await tx.produk.findUniqueOrThrow({
      where: { id: produkId },
    });
    const stokSesudah = produk.stok + qty;
    if (stokSesudah < 0) {
      throw new Error("Stok hasil penyesuaian tidak boleh negatif.");
    }

    await tx.produk.update({
      where: { id: produkId },
      data: { stok: stokSesudah },
    });

    const kartuStok = await tx.kartuStok.create({
      data: {
        produkId,
        jenisPergerakan: "PENYESUAIAN_MANUAL",
        qty,
        stokSebelum: produk.stok,
        stokSesudah,
        referensiTipe: "MANUAL",
        userId,
        catatan: alasan,
      },
    });

    // PRD 2.5 Integration Hooks: dikonsumsi modul akuntansi terpisah secara asinkron.
    await tx.eventLog.create({
      data: {
        eventType: "STOCK_ADJUSTED",
        referensiId: kartuStok.id,
        payload: {
          selisihQty: qty,
          nilaiHpp: Number(produk.hpp) * Math.abs(qty),
          alasan,
        },
      },
    });

    return kartuStok;
  });
}
