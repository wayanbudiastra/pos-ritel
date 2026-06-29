import { prisma } from "@/lib/prisma";
import type { Prisma, EventType } from "@prisma/client";
import { generateNomorJurnal } from "./jurnal.service";

// PRD akuntansi.md 5.3: consumer yang membaca EventLog dan mengubahnya jadi
// jurnal otomatis, tanpa pernah mengubah skema/tabel operasional (EventLog
// tetap dibaca apa adanya).

type Baris = { kunci: string; debit?: number; kredit?: number };
type Template = { keterangan: string; baris: Baris[] };

function asRecord(payload: Prisma.JsonValue): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0) || 0;
}

function kunciKasAtauBank(metode: unknown): "KAS" | "BANK" {
  return metode === "TRANSFER" || metode === "KARTU" ? "BANK" : "KAS";
}

// PRD akuntansi.md 5.3.2: template jurnal per event type.
function buatTemplate(eventType: EventType, payloadRaw: Prisma.JsonValue): Template | null {
  const payload = asRecord(payloadRaw);

  switch (eventType) {
    case "SALE_COMPLETED": {
      const total = num(payload.total);
      const hpp = num(payload.hpp);
      const baris: Baris[] = [
        { kunci: kunciKasAtauBank(payload.metodePembayaran), debit: total },
        { kunci: "PENDAPATAN_PENJUALAN", kredit: total },
      ];
      if (hpp > 0) {
        baris.push({ kunci: "HPP", debit: hpp }, { kunci: "PERSEDIAAN", kredit: hpp });
      }
      return { keterangan: "Penjualan (otomatis dari transaksi POS)", baris };
    }
    case "PURCHASE_RECEIVED": {
      const totalBiaya = num(payload.totalBiaya);
      return {
        keterangan: "Penerimaan barang dari supplier (otomatis dari GRN)",
        baris: [
          { kunci: "PERSEDIAAN", debit: totalBiaya },
          { kunci: "HUTANG_USAHA", kredit: totalBiaya },
        ],
      };
    }
    case "STOCK_ADJUSTED": {
      const selisihQty = num(payload.selisihQty);
      const nilaiHpp = num(payload.nilaiHpp);
      const alasan = typeof payload.alasan === "string" ? payload.alasan : "-";
      if (selisihQty === 0 || nilaiHpp === 0) {
        return { keterangan: `Penyesuaian stok tanpa nilai (${alasan})`, baris: [] };
      }
      if (selisihQty > 0) {
        return {
          keterangan: `Penyesuaian stok lebih (${alasan})`,
          baris: [
            { kunci: "PERSEDIAAN", debit: nilaiHpp },
            { kunci: "PENDAPATAN_LAIN", kredit: nilaiHpp },
          ],
        };
      }
      return {
        keterangan: `Penyesuaian stok kurang (${alasan})`,
        baris: [
          { kunci: "BEBAN_SELISIH_STOK", debit: nilaiHpp },
          { kunci: "PERSEDIAAN", kredit: nilaiHpp },
        ],
      };
    }
    case "PURCHASE_PAID": {
      const jumlah = num(payload.jumlahDibayar);
      return {
        keterangan: "Pembayaran hutang ke supplier (otomatis)",
        baris: [
          { kunci: "HUTANG_USAHA", debit: jumlah },
          { kunci: kunciKasAtauBank(payload.metode), kredit: jumlah },
        ],
      };
    }
    default:
      return null;
  }
}

async function getAkunIdByKunci() {
  const pemetaan = await prisma.pemetaanAkun.findMany();
  return new Map(pemetaan.map((p) => [p.kunci, p.akunId]));
}

function kunciYangHilang(baris: Baris[], akunIdByKunci: Map<string, string>) {
  return [...new Set(baris.map((b) => b.kunci).filter((k) => !akunIdByKunci.has(k)))];
}

export type AntrianItem = {
  id: string;
  eventType: EventType;
  referensiId: string;
  createdAt: Date;
  status: "SIAP" | "GAGAL";
  alasan: string | null;
};

// Pratinjau (read-only, tidak mengubah apa pun) status setiap event yang
// belum diproses — dihitung on-demand karena EventLog tidak diubah skemanya
// untuk menyimpan status gagal (lihat PRD akuntansi.md 5.3.3 & 6.3).
export async function previewAntrian(limit = 100): Promise<AntrianItem[]> {
  const [events, akunIdByKunci] = await Promise.all([
    prisma.eventLog.findMany({
      where: { diprosesAkuntansi: false },
      orderBy: { createdAt: "asc" },
      take: limit,
    }),
    getAkunIdByKunci(),
  ]);

  return events.map((event) => {
    const tmpl = buatTemplate(event.eventType, event.payload);
    const base = {
      id: event.id,
      eventType: event.eventType,
      referensiId: event.referensiId,
      createdAt: event.createdAt,
    };

    if (!tmpl) {
      return { ...base, status: "GAGAL" as const, alasan: "Jenis event tidak dikenali oleh consumer." };
    }
    if (tmpl.baris.length === 0) {
      return { ...base, status: "SIAP" as const, alasan: null };
    }
    const hilang = kunciYangHilang(tmpl.baris, akunIdByKunci);
    if (hilang.length > 0) {
      return {
        ...base,
        status: "GAGAL" as const,
        alasan: `Pemetaan akun belum diisi untuk: ${hilang.join(", ")}`,
      };
    }
    return { ...base, status: "SIAP" as const, alasan: null };
  });
}

export type HasilProsesEvent = {
  sukses: number;
  gagal: { eventLogId: string; eventType: EventType; alasan: string }[];
};

// PRD akuntansi.md 5.3.1: proses batch EventLog yang belum diproses. Event
// yang gagal dipetakan TIDAK menghentikan batch — event lain tetap diproses,
// dan event yang gagal tetap diprosesAkuntansi=false agar bisa dicoba ulang
// setelah Pemetaan Akun diperbaiki (idempotent, lihat 2.2).
export async function processEventLog(dibuatOlehId: string, batchSize = 100): Promise<HasilProsesEvent> {
  const events = await prisma.eventLog.findMany({
    where: { diprosesAkuntansi: false },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });
  const akunIdByKunci = await getAkunIdByKunci();

  let sukses = 0;
  const gagal: HasilProsesEvent["gagal"] = [];

  for (const event of events) {
    const tmpl = buatTemplate(event.eventType, event.payload);

    if (!tmpl) {
      gagal.push({
        eventLogId: event.id,
        eventType: event.eventType,
        alasan: "Jenis event tidak dikenali oleh consumer.",
      });
      continue;
    }

    if (tmpl.baris.length === 0) {
      await prisma.eventLog.update({ where: { id: event.id }, data: { diprosesAkuntansi: true } });
      sukses++;
      continue;
    }

    const hilang = kunciYangHilang(tmpl.baris, akunIdByKunci);
    if (hilang.length > 0) {
      gagal.push({
        eventLogId: event.id,
        eventType: event.eventType,
        alasan: `Pemetaan akun belum diisi untuk: ${hilang.join(", ")}`,
      });
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const tanggal = event.createdAt;
        const nomorJurnal = await generateNomorJurnal(tx, tanggal);
        await tx.jurnalEntry.create({
          data: {
            nomorJurnal,
            tanggal,
            keterangan: tmpl.keterangan,
            sumber: "OTOMATIS",
            eventLogId: event.id,
            dibuatOlehId,
            items: {
              create: tmpl.baris.map((b) => ({
                akunId: akunIdByKunci.get(b.kunci)!,
                debit: b.debit ?? 0,
                kredit: b.kredit ?? 0,
              })),
            },
          },
        });
        await tx.eventLog.update({ where: { id: event.id }, data: { diprosesAkuntansi: true } });
      });
      sukses++;
    } catch (error) {
      gagal.push({
        eventLogId: event.id,
        eventType: event.eventType,
        alasan: error instanceof Error ? error.message : "Kesalahan tidak diketahui.",
      });
    }
  }

  return { sukses, gagal };
}
