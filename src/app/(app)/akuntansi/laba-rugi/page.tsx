import { getLabaRugi } from "@/services/laporan-keuangan.service";
import { toInputDate } from "@/lib/date-range";
import { ExportButton } from "../../laporan/export-button";
import { PeriodeFilter } from "./periode-filter";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function LabaRugiPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = params.start ? new Date(params.start) : defaultStart;
  const end = params.end ? new Date(params.end) : now;

  const data = await getLabaRugi(start, end);

  const exportParams = new URLSearchParams({
    start: data.periode.start.toISOString(),
    end: data.periode.end.toISOString(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laporan Laba Rugi</h1>
          <p className="text-sm text-muted-foreground">
            Pendapatan dikurangi HPP dan beban operasional pada periode terpilih.
          </p>
        </div>
        <ExportButton href={`/api/laporan/laba-rugi/export?${exportParams.toString()}`} />
      </div>

      <PeriodeFilter defaultStart={toInputDate(defaultStart)} defaultEnd={toInputDate(now)} />

      <div className="max-w-xl space-y-4 rounded-lg border p-4">
        <Seksi
          judul="Pendapatan"
          items={data.pendapatan}
          total={data.totalPendapatan}
          labelTotal="Total Pendapatan"
        />

        <Seksi judul="Harga Pokok Penjualan (HPP)" items={data.hpp} total={data.totalHpp} labelTotal="Total HPP" negatif />

        <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
          <span>Laba Kotor</span>
          <span>{formatRupiah(data.labaKotor)}</span>
        </div>

        <Seksi
          judul="Beban Operasional"
          items={data.beban}
          total={data.totalBeban}
          labelTotal="Total Beban Operasional"
          negatif
        />

        <div className="flex items-center justify-between border-t-2 pt-2 text-base font-bold">
          <span>{data.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}</span>
          <span className={data.labaBersih >= 0 ? "text-green-600" : "text-destructive"}>
            {formatRupiah(data.labaBersih)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Seksi({
  judul,
  items,
  total,
  labelTotal,
  negatif,
}: {
  judul: string;
  items: { kode: string; nama: string; total: number }[];
  total: number;
  labelTotal: string;
  negatif?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{judul}</p>
      {items.length === 0 && <p className="pl-4 text-sm text-muted-foreground">Tidak ada transaksi.</p>}
      {items.map((item) => (
        <div key={item.kode} className="flex items-center justify-between pl-4 text-sm">
          <span>{item.nama}</span>
          <span>{negatif ? `(${formatRupiah(item.total)})` : formatRupiah(item.total)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pl-4 text-sm font-medium">
        <span>{labelTotal}</span>
        <span>{negatif ? `(${formatRupiah(total)})` : formatRupiah(total)}</span>
      </div>
    </div>
  );
}
