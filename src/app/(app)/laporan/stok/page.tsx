import Link from "next/link";
import { getLaporanStok } from "@/services/laporan.service";
import { Button } from "@/components/ui/button";
import { ExportButton } from "../export-button";
import { LaporanStokTable } from "./laporan-stok-table";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function LaporanStokPage() {
  const items = await getLaporanStok();
  const totalNilaiStok = items.reduce((s, i) => s + i.nilaiStok, 0);
  const perluReorder = items.filter((i) => i.perluReorder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laporan Stok</h1>
          <Button
            variant="link"
            size="sm"
            className="px-0"
            render={<Link href="/laporan" />}
          >
            ← Kembali ke Dashboard
          </Button>
        </div>
        <ExportButton href="/api/laporan/stok/export" />
      </div>

      <p className="text-sm text-muted-foreground">
        Total Nilai Stok:{" "}
        <span className="font-semibold text-foreground">
          {formatRupiah(totalNilaiStok)}
        </span>{" "}
        · {perluReorder.length} produk perlu reorder
      </p>

      <LaporanStokTable data={items} />
    </div>
  );
}
