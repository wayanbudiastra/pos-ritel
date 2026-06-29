import Link from "next/link";
import { getLaporanMargin } from "@/services/laporan.service";
import { resolveDateRange } from "@/lib/date-range";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "../date-range-filter";
import { ExportButton } from "../export-button";
import { LaporanMarginTable } from "./laporan-margin-table";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function LaporanMarginPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const { start, end } = resolveDateRange(params);
  const items = await getLaporanMargin(start, end);

  const exportParams = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const totalPenjualan = items.reduce((s, i) => s + i.penjualan, 0);
  const totalModal = items.reduce((s, i) => s + i.modal, 0);
  const totalMargin = totalPenjualan - totalModal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laporan Margin Kotor</h1>
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
          href={`/api/laporan/margin/export?${exportParams.toString()}`}
        />
      </div>

      <DateRangeFilter />

      <p className="text-sm text-muted-foreground">
        Total Penjualan: {formatRupiah(totalPenjualan)} · Total Modal:{" "}
        {formatRupiah(totalModal)} · Margin Kotor:{" "}
        <span className="font-semibold text-foreground">
          {formatRupiah(totalMargin)}
        </span>
      </p>

      <LaporanMarginTable data={items} />
    </div>
  );
}
