import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { STOK_OPNAME_APPROVAL_THRESHOLD } from "@/lib/config";

export class OpnameError extends Error {}

async function generateNomorOpname(tx: Prisma.TransactionClient) {
  const today = new Date();
  const prefix = `SO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const count = await tx.stokOpname.count({
    where: { nomorOpname: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listOpname() {
  return prisma.stokOpname.findMany({
    include: { dibuatOleh: { select: { nama: true } }, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getOpname(id: string) {
  return prisma.stokOpname.findUnique({
    where: { id },
    include: {
      dibuatOleh: { select: { nama: true } },
      items: { include: { produk: true } },
    },
  });
}

export async function createOpname(lingkup: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const produkList = await tx.produk.findMany({
      where:
        lingkup === "SEMUA"
          ? { aktif: true }
          : { aktif: true, kategoriId: lingkup },
    });
    if (produkList.length === 0) {
      throw new OpnameError("Tidak ada produk dalam lingkup yang dipilih.");
    }

    const nomorOpname = await generateNomorOpname(tx);

    return tx.stokOpname.create({
      data: {
        nomorOpname,
        lingkup,
        dibuatOlehId: userId,
        items: {
          create: produkList.map((p) => ({
            produkId: p.id,
            stokSistem: p.stok,
          })),
        },
      },
      include: { items: true },
    });
  });
}

export async function inputFisik(
  itemId: string,
  stokFisik: number,
  alasanKode: string | undefined,
) {
  const item = await prisma.stokOpnameItem.findUniqueOrThrow({
    where: { id: itemId },
  });
  const selisih = stokFisik - item.stokSistem;
  if (selisih !== 0 && !alasanKode) {
    throw new OpnameError("Item dengan selisih wajib memiliki alasan.");
  }
  return prisma.stokOpnameItem.update({
    where: { id: itemId },
    data: { stokFisik, selisih, alasanKode },
  });
}

async function terapkanPenyesuaian(
  tx: Prisma.TransactionClient,
  opnameId: string,
  userId: string,
) {
  const items = await tx.stokOpnameItem.findMany({
    where: { stokOpnameId: opnameId },
    include: { produk: true },
  });

  for (const item of items) {
    if (!item.selisih) continue;

    const stokSesudah = item.produk.stok + item.selisih;
    await tx.produk.update({
      where: { id: item.produkId },
      data: { stok: stokSesudah },
    });
    const kartuStok = await tx.kartuStok.create({
      data: {
        produkId: item.produkId,
        jenisPergerakan: "PENYESUAIAN_OPNAME",
        qty: item.selisih,
        stokSebelum: item.produk.stok,
        stokSesudah,
        referensiTipe: "STOK_OPNAME",
        referensiId: opnameId,
        userId,
        catatan: item.alasanKode,
      },
    });

    // PRD 2.5 Integration Hooks: dikonsumsi modul akuntansi terpisah secara asinkron.
    await tx.eventLog.create({
      data: {
        eventType: "STOCK_ADJUSTED",
        referensiId: kartuStok.id,
        payload: {
          selisihQty: item.selisih,
          nilaiHpp: Number(item.produk.hpp) * Math.abs(item.selisih),
          alasan: item.alasanKode,
        },
      },
    });
  }
}

// PRD 5.5.4 langkah 6: "Menunggu Approval" jika total nilai selisih melebihi
// ambang batas, atau langsung "Selesai" jika di bawah ambang batas.
export async function submitOpname(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.stokOpnameItem.findMany({
      where: { stokOpnameId: id },
      include: { produk: true },
    });

    const belumDiisi = items.some((i) => i.stokFisik === null);
    if (belumDiisi) {
      throw new OpnameError(
        "Semua item harus diisi stok fisiknya sebelum submit.",
      );
    }

    const totalNilaiSelisih = items.reduce(
      (sum, i) => sum + Math.abs(i.selisih ?? 0) * Number(i.produk.hpp),
      0,
    );

    if (totalNilaiSelisih > STOK_OPNAME_APPROVAL_THRESHOLD) {
      return tx.stokOpname.update({
        where: { id },
        data: { status: "MENUNGGU_APPROVAL" },
      });
    }

    await terapkanPenyesuaian(tx, id, userId);
    return tx.stokOpname.update({
      where: { id },
      data: { status: "SELESAI", selesaiPada: new Date() },
    });
  });
}

export async function approveOpname(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const opname = await tx.stokOpname.findUniqueOrThrow({ where: { id } });
    if (opname.status !== "MENUNGGU_APPROVAL") {
      throw new OpnameError(
        "Stok opname tidak dalam status Menunggu Approval.",
      );
    }
    await terapkanPenyesuaian(tx, id, userId);
    return tx.stokOpname.update({
      where: { id },
      data: { status: "SELESAI", selesaiPada: new Date() },
    });
  });
}
