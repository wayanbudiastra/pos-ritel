import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { JurnalManualInput } from "@/validations/jurnal.schema";

export class JurnalError extends Error {}

export async function generateNomorJurnal(tx: Prisma.TransactionClient, tanggal: Date) {
  const prefix = `JRN-${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, "0")}${String(
    tanggal.getDate()
  ).padStart(2, "0")}`;
  const count = await tx.jurnalEntry.count({ where: { nomorJurnal: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listJurnal() {
  return prisma.jurnalEntry.findMany({
    orderBy: { tanggal: "desc" },
    take: 100,
    include: {
      items: true,
      dibuatOleh: { select: { nama: true } },
      jurnalPembalik: { select: { id: true, nomorJurnal: true } },
      jurnalPembalikDari: { select: { id: true, nomorJurnal: true } },
    },
  });
}

export function getJurnalEntry(id: string) {
  return prisma.jurnalEntry.findUnique({
    where: { id },
    include: {
      items: { include: { akun: true } },
      dibuatOleh: { select: { nama: true } },
      jurnalPembalik: { select: { id: true, nomorJurnal: true } },
      jurnalPembalikDari: { select: { id: true, nomorJurnal: true } },
    },
  });
}

// PRD akuntansi.md 5.4: total debit harus sama dengan total kredit (sudah
// divalidasi di Zod schema, divalidasi ulang di sini sebagai defense-in-depth).
export async function createJurnalManual(data: JurnalManualInput, userId: string) {
  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalKredit = data.lines.reduce((sum, l) => sum + l.kredit, 0);
  if (Math.abs(totalDebit - totalKredit) >= 0.01) {
    throw new JurnalError("Total debit harus sama dengan total kredit.");
  }

  return prisma.$transaction(async (tx) => {
    const tanggal = new Date(data.tanggal);
    const nomorJurnal = await generateNomorJurnal(tx, tanggal);

    return tx.jurnalEntry.create({
      data: {
        nomorJurnal,
        tanggal,
        keterangan: data.keterangan,
        sumber: "MANUAL",
        dibuatOlehId: userId,
        items: {
          create: data.lines.map((l) => ({
            akunId: l.akunId,
            debit: l.debit,
            kredit: l.kredit,
            keterangan: l.keterangan,
          })),
        },
      },
      include: { items: true },
    });
  });
}

// PRD akuntansi.md 5.4.2: jurnal pembalik membalik seluruh baris debit/kredit,
// mereferensikan jurnal asal. Jurnal yang sudah dibalik tidak dapat dibalik lagi.
export async function balikJurnal(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const asal = await tx.jurnalEntry.findUnique({
      where: { id },
      include: { items: true, jurnalPembalik: true },
    });
    if (!asal) throw new JurnalError("Jurnal tidak ditemukan.");
    if (asal.status === "DIBATALKAN") {
      throw new JurnalError("Jurnal ini sudah dibatalkan.");
    }
    if (asal.jurnalPembalik) {
      throw new JurnalError("Jurnal ini sudah pernah dibalik.");
    }

    const tanggal = new Date();
    const nomorJurnal = await generateNomorJurnal(tx, tanggal);

    return tx.jurnalEntry.create({
      data: {
        nomorJurnal,
        tanggal,
        keterangan: `Pembalik dari ${asal.nomorJurnal}`,
        sumber: "MANUAL",
        dibuatOlehId: userId,
        jurnalPembalikDariId: asal.id,
        items: {
          create: asal.items.map((l) => ({
            akunId: l.akunId,
            debit: l.kredit,
            kredit: l.debit,
            keterangan: l.keterangan,
          })),
        },
      },
      include: { items: true },
    });
  });
}
