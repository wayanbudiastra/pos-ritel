import { getNeraca } from "@/services/laporan-keuangan.service";
import { toInputDate } from "@/lib/date-range";
import { ExportButton } from "../../laporan/export-button";
import { CutOffFilter } from "./cutoff-filter";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function NeracaPage({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const tanggalCutOff = params.tanggal ? new Date(params.tanggal) : now;

  const data = await getNeraca(tanggalCutOff);

  const exportParams = new URLSearchParams({ tanggal: data.tanggalCutOff.toISOString() });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laporan Neraca</h1>
          <p className="text-sm text-muted-foreground">
            Saldo Aset, Liabilitas, dan Ekuitas kumulatif per tanggal cut-off.
          </p>
        </div>
        <ExportButton href={`/api/laporan/neraca/export?${exportParams.toString()}`} />
      </div>

      <CutOffFilter defaultValue={toInputDate(now)} />

      {!data.balanced && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Peringatan: Total Aset tidak sama dengan Total Liabilitas + Ekuitas. Periksa kembali jurnal yang tercatat.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-4">
          <Kolom judul="ASET" items={data.aset} total={data.totalAset} labelTotal="Total Aset" />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <Kolom judul="LIABILITAS" items={data.liabilitas} total={data.totalLiabilitas} labelTotal="Total Liabilitas" />

          <div>
            <p className="text-sm font-medium text-muted-foreground">EKUITAS</p>
            {data.ekuitasAkun.map((item) => (
              <div key={item.kode} className="flex items-center justify-between pl-4 text-sm">
                <span>{item.nama}</span>
                <span>{formatRupiah(item.total)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pl-4 text-sm">
              <span>Laba Ditahan (Berjalan)</span>
              <span>{formatRupiah(data.labaDitahanBerjalan)}</span>
            </div>
            <div className="flex items-center justify-between pl-4 text-sm font-medium">
              <span>Total Ekuitas</span>
              <span>{formatRupiah(data.totalEkuitas)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-2 pt-2 text-base font-bold">
            <span>Total Liabilitas + Ekuitas</span>
            <span>{formatRupiah(data.totalLiabilitasEkuitas)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kolom({
  judul,
  items,
  total,
  labelTotal,
}: {
  judul: string;
  items: { kode: string; nama: string; total: number }[];
  total: number;
  labelTotal: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{judul}</p>
      {items.length === 0 && <p className="pl-4 text-sm text-muted-foreground">Belum ada saldo.</p>}
      {items.map((item) => (
        <div key={item.kode} className="flex items-center justify-between pl-4 text-sm">
          <span>{item.nama}</span>
          <span>{formatRupiah(item.total)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t-2 pt-2 text-base font-bold">
        <span>{labelTotal}</span>
        <span>{formatRupiah(total)}</span>
      </div>
    </div>
  );
}
