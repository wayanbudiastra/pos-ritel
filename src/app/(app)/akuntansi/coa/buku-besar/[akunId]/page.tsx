import Link from "next/link";
import { notFound } from "next/navigation";
import { getBukuBesar } from "@/services/buku-besar.service";
import { Button } from "@/components/ui/button";
import { BukuBesarTable } from "./buku-besar-table";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function BukuBesarPage({
  params,
}: {
  params: Promise<{ akunId: string }>;
}) {
  const { akunId } = await params;
  const { akun, saldoAkhir, items } = await getBukuBesar(akunId).catch(() => {
    notFound();
  });

  const data = items.map((i) => ({
    id: i.id,
    jurnalEntryId: i.jurnalEntryId,
    tanggal: i.tanggal.toISOString(),
    nomorJurnal: i.nomorJurnal,
    keterangan: i.keterangan,
    sumber: i.sumber,
    debit: i.debit,
    kredit: i.kredit,
    saldoBerjalan: i.saldoBerjalan,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          Buku Besar: {akun.kode} — {akun.nama}
        </h1>
        <p className="text-sm text-muted-foreground">
          Saldo Akhir: <span className="font-semibold text-foreground">{formatRupiah(saldoAkhir)}</span>
        </p>
        <Button variant="link" size="sm" className="px-0" render={<Link href="/akuntansi/coa" />}>
          ← Kembali ke Chart of Account
        </Button>
      </div>
      <BukuBesarTable data={data} />
    </div>
  );
}
