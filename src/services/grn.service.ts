import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreateGrnInput } from "@/validations/grn.schema";

export class GrnError extends Error {}

async function generateNomorGRN(tx: Prisma.TransactionClient) {
  const today = new Date();
  const prefix = `GRN-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const count = await tx.gRN.count({
    where: { nomorGRN: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listGRN() {
  return prisma.gRN.findMany({
    include: {
      po: { include: { supplier: true } },
      diterimaOleh: { select: { nama: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getGRN(id: string) {
  return prisma.gRN.findUnique({
    where: { id },
    include: {
      po: { include: { supplier: true } },
      diterimaOleh: { select: { nama: true } },
      items: { include: { produk: true } },
    },
  });
}

export async function createGRN(data: CreateGrnInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: data.poId },
      include: { items: true },
    });
    if (
      !po ||
      (po.status !== "DISETUJUI" && po.status !== "SEBAGIAN_DITERIMA")
    ) {
      throw new GrnError(
        "PO harus berstatus Disetujui atau Sebagian Diterima.",
      );
    }

    const poItemMap = new Map(po.items.map((i) => [i.id, i]));
    const nomorGRN = await generateNomorGRN(tx);

    const grn = await tx.gRN.create({
      data: {
        nomorGRN,
        poId: po.id,
        diterimaOlehId: userId,
        catatan: data.catatan,
      },
    });

    for (const item of data.items) {
      const poItem = poItemMap.get(item.poItemId);
      if (!poItem) {
        throw new GrnError("Item PO tidak ditemukan.");
      }
      const outstanding = poItem.qtyPesan - poItem.qtyDiterima;
      const totalDiproses = item.qtyDiterima + item.qtyDitolak;

      if (totalDiproses > outstanding && !item.terimaKelebihan) {
        throw new GrnError(
          `Qty diterima+ditolak (${totalDiproses}) melebihi outstanding (${outstanding}) untuk produk. Aktifkan "terima kelebihan" jika disengaja.`,
        );
      }

      const adaDiskrepansi =
        Number(item.hargaAktual) !== Number(poItem.hargaBeli) ||
        totalDiproses > outstanding;

      await tx.gRNItem.create({
        data: {
          grnId: grn.id,
          produkId: item.produkId,
          qtyDiterima: item.qtyDiterima,
          qtyDitolak: item.qtyDitolak,
          hargaAktual: item.hargaAktual,
          nomorBatch: item.nomorBatch,
          tanggalExpired: item.tanggalExpired
            ? new Date(item.tanggalExpired)
            : null,
          adaDiskrepansi,
        },
      });

      await tx.pOItem.update({
        where: { id: poItem.id },
        data: { qtyDiterima: poItem.qtyDiterima + item.qtyDiterima },
      });

      if (item.qtyDiterima > 0) {
        const produk = await tx.produk.findUniqueOrThrow({
          where: { id: item.produkId },
        });
        const stokSesudah = produk.stok + item.qtyDiterima;

        // PRD 5.4.4: HPP baru dihitung dengan metode rata-rata bergerak (moving average).
        const hppBaru =
          (produk.stok * Number(produk.hpp) +
            item.qtyDiterima * Number(item.hargaAktual)) /
          stokSesudah;

        await tx.produk.update({
          where: { id: item.produkId },
          data: { stok: stokSesudah, hpp: hppBaru },
        });

        await tx.kartuStok.create({
          data: {
            produkId: item.produkId,
            jenisPergerakan: "PENERIMAAN_GRN",
            qty: item.qtyDiterima,
            stokSebelum: produk.stok,
            stokSesudah,
            referensiTipe: "GRN",
            referensiId: grn.id,
            userId,
          },
        });
      }
    }

    const poItemsAfter = await tx.pOItem.findMany({ where: { poId: po.id } });
    const semuaLengkap = poItemsAfter.every((i) => i.qtyDiterima >= i.qtyPesan);

    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: semuaLengkap ? "SELESAI" : "SEBAGIAN_DITERIMA" },
    });

    const totalBiaya = data.items.reduce(
      (sum, i) => sum + i.qtyDiterima * i.hargaAktual,
      0,
    );

    // PRD 2.5 Integration Hooks: dikonsumsi modul akuntansi terpisah secara asinkron.
    await tx.eventLog.create({
      data: {
        eventType: "PURCHASE_RECEIVED",
        referensiId: grn.id,
        payload: {
          totalBiaya,
          supplierId: po.supplierId,
          statusHutang: "BELUM_DIBAYAR",
        },
      },
    });

    return tx.gRN.findUniqueOrThrow({
      where: { id: grn.id },
      include: { items: true },
    });
  });
}
