import Link from "next/link";
import {
  getKpiDashboard,
  getRingkasanRange,
  getTopProduk,
  getSlowMoving,
  getMemberAnalytics,
  getPerformaKasir,
} from "@/services/laporan.service";
import { resolveDateRange } from "@/lib/date-range";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "./date-range-filter";
import { KpiCard } from "./kpi-card";
import { SalesTrendChart } from "./sales-trend-chart";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const { start, end } = resolveDateRange(params);

  const [
    kpi,
    ringkasan,
    topProduk,
    slowMoving,
    memberAnalytics,
    performaKasir,
  ] = await Promise.all([
    getKpiDashboard(start, end),
    getRingkasanRange(start, end),
    getTopProduk(start, end),
    getSlowMoving(30),
    getMemberAnalytics(start, end),
    getPerformaKasir(start, end),
  ]);

  const chartData = ringkasan.map((r) => ({
    tanggal: new Date(r.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
    Ritel: Number(r.totalRitel),
    Grosir: Number(r.totalGrosir),
    Khusus: Number(r.totalKhusus),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <DateRangeFilter />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/laporan/penjualan" />}
        >
          Laporan Penjualan
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/laporan/margin" />}
        >
          Laporan Margin
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/laporan/stok" />}
        >
          Laporan Stok
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/laporan/pembelian" />}
        >
          Laporan Pembelian
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Penjualan"
          value={formatRupiah(kpi.totalPenjualan.value)}
          changePct={kpi.totalPenjualan.changePct}
        />
        <KpiCard
          label="Total Transaksi"
          value={String(kpi.totalTransaksi.value)}
          changePct={kpi.totalTransaksi.changePct}
        />
        <KpiCard
          label="Rata-rata Transaksi"
          value={formatRupiah(kpi.rataRata.value)}
          changePct={kpi.rataRata.changePct}
        />
        <KpiCard
          label="Estimasi Margin Kotor"
          value={formatRupiah(kpi.marginKotor.value)}
          changePct={kpi.marginKotor.changePct}
        />
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <h2 className="text-lg font-medium">Tren Penjualan</h2>
        <SalesTrendChart data={chartData} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Top 10 Produk Terlaris (Qty)</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Qty Terjual</TableHead>
                <TableHead>Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProduk.byQty.map((p) => (
                <TableRow key={p.produkId}>
                  <TableCell>{p.nama}</TableCell>
                  <TableCell>{p.qty}</TableCell>
                  <TableCell>{formatRupiah(p.nilai)}</TableCell>
                </TableRow>
              ))}
              {topProduk.byQty.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium">Produk Slow-Moving (30 Hari)</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Qty Terjual</TableHead>
                <TableHead>Stok</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slowMoving.map((p) => (
                <TableRow key={p.produkId}>
                  <TableCell>{p.nama}</TableCell>
                  <TableCell>{p.qtyTerjual}</TableCell>
                  <TableCell>{p.stok}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">
            Top Member (Belanja Tertinggi)
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Total Belanja</TableHead>
                <TableHead>Frekuensi</TableHead>
                <TableHead>% Harga Khusus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberAnalytics.map((m) => (
                <TableRow key={m.memberId}>
                  <TableCell>
                    {m.nama}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({m.kodeMember})
                    </span>
                  </TableCell>
                  <TableCell>{formatRupiah(m.totalBelanja)}</TableCell>
                  <TableCell>{m.frekuensi}</TableCell>
                  <TableCell>{m.efektivitasHargaKhusus.toFixed(0)}%</TableCell>
                </TableRow>
              ))}
              {memberAnalytics.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium">Performa Kasir</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kasir</TableHead>
                <TableHead>Jumlah Transaksi</TableHead>
                <TableHead>Total Penjualan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performaKasir.map((k) => (
                <TableRow key={k.kasirId}>
                  <TableCell>{k.nama}</TableCell>
                  <TableCell>{k.totalTransaksi}</TableCell>
                  <TableCell>{formatRupiah(k.totalPenjualan)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
