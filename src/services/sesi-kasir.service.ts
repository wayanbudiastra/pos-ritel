import { prisma } from "@/lib/prisma";

export function getSesiAktif(userId: string) {
  return prisma.sesiKasir.findFirst({
    where: { userId, ditutupPada: null },
    orderBy: { dibukaPada: "desc" },
  });
}

export function bukaSesi(userId: string, modalAwal: number) {
  return prisma.sesiKasir.create({
    data: { userId, modalAwal },
  });
}

// PRD 5.1.4: rekap kas masuk per metode pembayaran untuk rekonsiliasi penutupan sesi.
export async function getRekapSesi(sesiKasirId: string) {
  const transaksi = await prisma.transaksi.findMany({
    where: { sesiKasirId, status: "PAID" },
  });

  const rekapPerMetode = transaksi.reduce<Record<string, number>>((acc, t) => {
    const metode = t.metodePembayaran ?? "LAINNYA";
    acc[metode] = (acc[metode] ?? 0) + Number(t.total);
    return acc;
  }, {});

  const totalTunai = rekapPerMetode["TUNAI"] ?? 0;
  const totalTransaksi = transaksi.length;
  const totalPenjualan = transaksi.reduce((sum, t) => sum + Number(t.total), 0);

  return { rekapPerMetode, totalTunai, totalTransaksi, totalPenjualan };
}

export async function tutupSesi(
  sesiKasirId: string,
  totalKasAkhir: number,
  catatan?: string,
) {
  return prisma.sesiKasir.update({
    where: { id: sesiKasirId },
    data: { totalKasAkhir, catatan, ditutupPada: new Date() },
  });
}
