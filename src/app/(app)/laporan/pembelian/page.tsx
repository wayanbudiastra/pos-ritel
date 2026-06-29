import Link from "next/link";
import { getLaporanPembelian } from "@/services/laporan.service";
import { resolveDateRange } from "@/lib/date-range";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "../date-range-filter";
import { ExportButton } from "../export-button";
import { LaporanPembelianTable } from "./laporan-pembelian-table";

export default async function LaporanPembelianPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const { start, end } = resolveDateRange(params);
  const items = await getLaporanPembelian(start, end);
  const exportParams = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });

  const data = items.map((po) => ({
    ...po,
    createdAt: po.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laporan Pembelian</h1>
          <Button
            variant="link"
            size="sm"
            className="px-0"
            render={<Link href="/laporan" />}
          >
            ← Kembali ke Dashboard
          </Button>
        </div>
        <ExportButton
          href={`/api/laporan/pembelian/export?${exportParams.toString()}`}
        />
      </div>

      <DateRangeFilter />

      <LaporanPembelianTable data={data} />
    </div>
  );
}
