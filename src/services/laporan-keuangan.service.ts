import { prisma } from "@/lib/prisma";
import type { TipeAkun } from "@prisma/client";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

type SaldoAkun = { kode: string; nama: string; total: number };

// Saldo dihitung searah saldoNormal akun, sehingga PENDAPATAN/LIABILITAS/EKUITAS
// (saldoNormal KREDIT) bernilai positif saat kredit > debit, dan
// ASET/BEBAN/HPP (saldoNormal DEBIT) bernilai positif saat debit > kredit.
async function saldoPerAkun(tipe: TipeAkun, opts: { dari?: Date; hingga?: Date }): Promise<SaldoAkun[]> {
  const lines = await prisma.jurnalLine.findMany({
    where: {
      akun: { tipe },
      jurnalEntry: {
        status: "POSTED",
        tanggal: {
          ...(opts.dari && { gte: opts.dari }),
          ...(opts.hingga && { lte: opts.hingga }),
        },
      },
    },
    include: { akun: true },
  });

  const byAkun = new Map<string, SaldoAkun>();
  for (const line of lines) {
    const debit = Number(line.debit);
    const kredit = Number(line.kredit);
    const arah = line.akun.saldoNormal === "DEBIT" ? debit - kredit : kredit - debit;
    const existing = byAkun.get(line.akun.id);
    if (existing) {
      existing.total += arah;
    } else {
      byAkun.set(line.akun.id, { kode: line.akun.kode, nama: line.akun.nama, total: arah });
    }
  }
  return [...byAkun.values()].sort((a, b) => a.kode.localeCompare(b.kode));
}

// PRD akuntansi.md 5.6: dihitung dari rentang tanggal (tidak ada tutup buku).
export async function getLabaRugi(start: Date, end: Date) {
  const dari = startOfDay(start);
  const hingga = endOfDay(end);

  const [pendapatan, hpp, beban] = await Promise.all([
    saldoPerAkun("PENDAPATAN", { dari, hingga }),
    saldoPerAkun("HPP", { dari, hingga }),
    saldoPerAkun("BEBAN", { dari, hingga }),
  ]);

  const totalPendapatan = pendapatan.reduce((s, a) => s + a.total, 0);
  const totalHpp = hpp.reduce((s, a) => s + a.total, 0);
  const labaKotor = totalPendapatan - totalHpp;
  const totalBeban = beban.reduce((s, a) => s + a.total, 0);
  const labaBersih = labaKotor - totalBeban;

  return {
    periode: { start: dari, end: hingga },
    pendapatan,
    totalPendapatan,
    hpp,
    totalHpp,
    labaKotor,
    beban,
    totalBeban,
    labaBersih,
  };
}

// PRD akuntansi.md 5.7: saldo Aset/Liabilitas/Ekuitas akumulatif sejak awal
// data sampai tanggalCutOff; Laba Ditahan dihitung sebagai laba/rugi kumulatif
// (PENDAPATAN - HPP - BEBAN) karena tidak ada proses tutup buku formal.
export async function getNeraca(tanggalCutOff: Date) {
  const hingga = endOfDay(tanggalCutOff);

  const [aset, liabilitas, ekuitasAkun, pendapatan, hpp, beban] = await Promise.all([
    saldoPerAkun("ASET", { hingga }),
    saldoPerAkun("LIABILITAS", { hingga }),
    saldoPerAkun("EKUITAS", { hingga }),
    saldoPerAkun("PENDAPATAN", { hingga }),
    saldoPerAkun("HPP", { hingga }),
    saldoPerAkun("BEBAN", { hingga }),
  ]);

  const totalAset = aset.reduce((s, a) => s + a.total, 0);
  const totalLiabilitas = liabilitas.reduce((s, a) => s + a.total, 0);
  const totalEkuitasAkun = ekuitasAkun.reduce((s, a) => s + a.total, 0);

  const totalPendapatan = pendapatan.reduce((s, a) => s + a.total, 0);
  const totalHpp = hpp.reduce((s, a) => s + a.total, 0);
  const totalBeban = beban.reduce((s, a) => s + a.total, 0);
  const labaDitahanBerjalan = totalPendapatan - totalHpp - totalBeban;

  const totalEkuitas = totalEkuitasAkun + labaDitahanBerjalan;
  const totalLiabilitasEkuitas = totalLiabilitas + totalEkuitas;
  const balanced = Math.abs(totalAset - totalLiabilitasEkuitas) < 0.01;

  return {
    tanggalCutOff: hingga,
    aset,
    totalAset,
    liabilitas,
    totalLiabilitas,
    ekuitasAkun,
    labaDitahanBerjalan,
    totalEkuitas,
    totalLiabilitasEkuitas,
    balanced,
  };
}
