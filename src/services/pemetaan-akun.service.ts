import { prisma } from "@/lib/prisma";

// Daftar kunci yang dipakai logic jurnal otomatis (PRD akuntansi.md 5.2).
// Disimpan sebagai konstanta kode supaya konsisten dengan dokumen PRD.
export const KUNCI_PEMETAAN = [
  { kunci: "KAS", label: "Penjualan Tunai" },
  { kunci: "BANK", label: "Penjualan Transfer/QRIS/Kartu" },
  { kunci: "PIUTANG_USAHA", label: "Penjualan Kredit (cadangan)" },
  { kunci: "PERSEDIAAN", label: "Mutasi Stok (penjualan, GRN, penyesuaian)" },
  { kunci: "HUTANG_USAHA", label: "Penerimaan Barang dari Supplier (kredit)" },
  { kunci: "PENDAPATAN_PENJUALAN", label: "Pendapatan dari Penjualan" },
  { kunci: "PENDAPATAN_LAIN", label: "Selisih Stok Lebih" },
  { kunci: "HPP", label: "Harga Pokok Penjualan" },
  { kunci: "BEBAN_SELISIH_STOK", label: "Selisih Stok Kurang" },
] as const;

export async function listPemetaanAkun() {
  const data = await prisma.pemetaanAkun.findMany({ include: { akun: true } });
  const byKunci = new Map(data.map((p) => [p.kunci, p]));

  return KUNCI_PEMETAAN.map((k) => ({
    kunci: k.kunci,
    label: k.label,
    akunId: byKunci.get(k.kunci)?.akunId ?? null,
    akunNama: byKunci.get(k.kunci)?.akun.nama ?? null,
    akunKode: byKunci.get(k.kunci)?.akun.kode ?? null,
  }));
}

export function setPemetaanAkun(kunci: string, akunId: string) {
  return prisma.pemetaanAkun.upsert({
    where: { kunci },
    update: { akunId },
    create: { kunci, akunId },
  });
}
