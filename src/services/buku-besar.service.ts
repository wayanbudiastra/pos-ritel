import { prisma } from "@/lib/prisma";

// PRD akuntansi.md 5.5: saldo berjalan dihitung kumulatif sejak baris pertama
// (agar akurat), baru kemudian tabel yang ditampilkan dibatasi ke 100 baris
// terakhir — konsisten dengan pola pembatasan tabel di seluruh aplikasi ini.
export async function getBukuBesar(akunId: string) {
  const akun = await prisma.akun.findUniqueOrThrow({ where: { id: akunId } });

  const lines = await prisma.jurnalLine.findMany({
    where: { akunId },
    include: {
      jurnalEntry: {
        select: { id: true, nomorJurnal: true, tanggal: true, keterangan: true, sumber: true },
      },
    },
    orderBy: [{ jurnalEntry: { tanggal: "asc" } }, { id: "asc" }],
  });

  let saldo = 0;
  const withRunningBalance = lines.map((line) => {
    const debit = Number(line.debit);
    const kredit = Number(line.kredit);
    saldo += akun.saldoNormal === "DEBIT" ? debit - kredit : kredit - debit;
    return {
      id: line.id,
      jurnalEntryId: line.jurnalEntry.id,
      tanggal: line.jurnalEntry.tanggal,
      nomorJurnal: line.jurnalEntry.nomorJurnal,
      keterangan: line.keterangan ?? line.jurnalEntry.keterangan,
      sumber: line.jurnalEntry.sumber,
      debit,
      kredit,
      saldoBerjalan: saldo,
    };
  });

  return {
    akun,
    saldoAkhir: saldo,
    items: withRunningBalance.slice(-100).reverse(),
  };
}
