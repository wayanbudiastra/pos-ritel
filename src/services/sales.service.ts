import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CheckoutInput } from "@/validations/transaksi.schema";

export class CheckoutError extends Error {}

type ResolvedItem = {
  produkId: string;
  nama: string;
  qty: number;
  hargaSatuan: number;
  tipeHarga: "RITEL" | "GROSIR" | "KHUSUS";
  subtotal: number;
};

// PRD 5.1.2: Logika Penentuan Harga (Price Resolution) — dijalankan per-item.
export function resolveHarga(
  produk: {
    hargaRitel: Prisma.Decimal | number;
    hargaGrosir: Prisma.Decimal | number;
    minQtyGrosir: number;
  },
  qty: number,
  tipeTransaksi: "RITEL" | "GROSIR",
  hargaKhususAktif?: number,
): { harga: number; tipeHarga: "RITEL" | "GROSIR" | "KHUSUS" } {
  if (hargaKhususAktif !== undefined) {
    return { harga: hargaKhususAktif, tipeHarga: "KHUSUS" };
  }
  if (tipeTransaksi === "GROSIR" && qty >= produk.minQtyGrosir) {
    return { harga: Number(produk.hargaGrosir), tipeHarga: "GROSIR" };
  }
  return { harga: Number(produk.hargaRitel), tipeHarga: "RITEL" };
}

async function generateNomorTransaksi(tx: Prisma.TransactionClient) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `TRX-${yyyy}${mm}${dd}`;

  const count = await tx.transaksi.count({
    where: { nomorTransaksi: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function checkout(
  input: CheckoutInput,
  kasirId: string,
  role: string,
) {
  return prisma.$transaction(async (tx) => {
    const sesi = await tx.sesiKasir.findUnique({
      where: { id: input.sesiKasirId },
    });
    if (!sesi || sesi.userId !== kasirId || sesi.ditutupPada) {
      throw new CheckoutError("Sesi kasir tidak valid atau sudah ditutup.");
    }

    const produkIds = input.items.map((i) => i.produkId);
    const produkList = await tx.produk.findMany({
      where: { id: { in: produkIds } },
    });
    const produkMap = new Map(produkList.map((p) => [p.id, p]));

    let hargaKhususMap = new Map<string, number>();
    if (input.memberId) {
      const now = new Date();
      const hargaKhususList = await tx.hargaKhusus.findMany({
        where: {
          memberId: input.memberId,
          produkId: { in: produkIds },
          status: "AKTIF",
        },
      });
      hargaKhususMap = new Map(
        hargaKhususList
          .filter(
            (h) =>
              (!h.tanggalMulai || h.tanggalMulai <= now) &&
              (!h.tanggalBerakhir || h.tanggalBerakhir >= now),
          )
          .map((h) => [h.produkId, Number(h.hargaKhusus)]),
      );
    }

    const resolvedItems: ResolvedItem[] = [];
    for (const item of input.items) {
      const produk = produkMap.get(item.produkId);
      if (!produk || !produk.aktif) {
        throw new CheckoutError(`Produk tidak ditemukan atau nonaktif.`);
      }
      if (produk.stok < item.qty) {
        throw new CheckoutError(
          `Stok ${produk.nama} tidak cukup (tersedia ${produk.stok}).`,
        );
      }
      const { harga, tipeHarga } = resolveHarga(
        produk,
        item.qty,
        input.tipeTransaksi,
        hargaKhususMap.get(item.produkId),
      );
      resolvedItems.push({
        produkId: item.produkId,
        nama: produk.nama,
        qty: item.qty,
        hargaSatuan: harga,
        tipeHarga,
        subtotal: harga * item.qty,
      });
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

    const maxDiskon = role === "ADMIN" ? Infinity : subtotal * 0.1;
    if (input.diskonTotal > maxDiskon) {
      throw new CheckoutError(
        "Diskon melebihi batas maksimum 10% untuk peran Kasir.",
      );
    }

    const total = subtotal - input.diskonTotal;
    if (input.jumlahDibayar < total) {
      throw new CheckoutError("Jumlah dibayar kurang dari total transaksi.");
    }
    const kembalian = input.jumlahDibayar - total;

    const nomorTransaksi = await generateNomorTransaksi(tx);

    const transaksi = await tx.transaksi.create({
      data: {
        nomorTransaksi,
        tipeTransaksi: input.tipeTransaksi,
        memberId: input.memberId || null,
        kasirId,
        sesiKasirId: input.sesiKasirId,
        subtotal,
        diskonTotal: input.diskonTotal,
        total,
        metodePembayaran: input.metodePembayaran,
        jumlahDibayar: input.jumlahDibayar,
        kembalian,
        status: "PAID",
        items: {
          create: resolvedItems.map((i) => ({
            produkId: i.produkId,
            qty: i.qty,
            hargaSatuan: i.hargaSatuan,
            tipeHarga: i.tipeHarga,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { items: { include: { produk: true } }, member: true },
    });

    let totalHpp = 0;
    for (const item of resolvedItems) {
      const produk = produkMap.get(item.produkId)!;
      const stokSesudah = produk.stok - item.qty;
      totalHpp += Number(produk.hpp) * item.qty;
      await tx.produk.update({
        where: { id: item.produkId },
        data: { stok: stokSesudah },
      });
      await tx.kartuStok.create({
        data: {
          produkId: item.produkId,
          jenisPergerakan: "PENJUALAN",
          qty: -item.qty,
          stokSebelum: produk.stok,
          stokSesudah,
          referensiTipe: "TRANSAKSI",
          referensiId: transaksi.id,
          userId: kasirId,
        },
      });
    }

    // PRD 2.5 Integration Hooks: dikonsumsi modul akuntansi terpisah secara asinkron.
    await tx.eventLog.create({
      data: {
        eventType: "SALE_COMPLETED",
        referensiId: transaksi.id,
        payload: {
          total,
          metodePembayaran: input.metodePembayaran,
          hpp: totalHpp,
          customerId: input.memberId ?? null,
        },
      },
    });

    return transaksi;
  });
}

export function listTransaksiHariIni(sesiKasirId: string) {
  return prisma.transaksi.findMany({
    where: { sesiKasirId, status: "PAID" },
    include: { items: true, member: true },
    orderBy: { createdAt: "desc" },
  });
}

export function searchTransaksiPaid(nomorTransaksi: string) {
  return prisma.transaksi.findMany({
    where: {
      status: "PAID",
      nomorTransaksi: { contains: nomorTransaksi, mode: "insensitive" },
    },
    include: {
      items: { include: { produk: true } },
      member: true,
      kasir: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function returItem(
  transaksiItemId: string,
  qty: number,
  alasan: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.transaksiItem.findUnique({
      where: { id: transaksiItemId },
      include: { transaksi: true, produk: true },
    });
    if (!item || item.transaksi.status !== "PAID") {
      throw new CheckoutError("Item transaksi tidak valid untuk retur.");
    }
    const sisaQty = item.qty - item.qtyRetur;
    if (qty > sisaQty) {
      throw new CheckoutError(
        `Qty retur melebihi sisa qty yang dapat diretur (${sisaQty}).`,
      );
    }

    await tx.transaksiItem.update({
      where: { id: transaksiItemId },
      data: { qtyRetur: item.qtyRetur + qty },
    });

    const stokSesudah = item.produk.stok + qty;
    await tx.produk.update({
      where: { id: item.produkId },
      data: { stok: stokSesudah },
    });

    await tx.kartuStok.create({
      data: {
        produkId: item.produkId,
        jenisPergerakan: "RETUR_PENJUALAN",
        qty,
        stokSebelum: item.produk.stok,
        stokSesudah,
        referensiTipe: "TRANSAKSI",
        referensiId: item.transaksiId,
        userId,
        catatan: alasan,
      },
    });

    return item;
  });
}
