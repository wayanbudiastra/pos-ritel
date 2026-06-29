import Link from "next/link";
import { getLaporanPenjualan } from "@/services/laporan.service";
import { listMember } from "@/services/member.service";
import { resolveDateRange } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "../date-range-filter";
import { ExportButton } from "../export-button";
import { LaporanPenjualanTable } from "./laporan-penjualan-table";

export default async function LaporanPenjualanPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
    kasirId?: string;
    tipeHarga?: string;
    memberId?: string;
  }>;
}) {
  const params = await searchParams;
  const { start, end } = resolveDateRange(params);
  const kasirId =
    params.kasirId && params.kasirId !== "ALL" ? params.kasirId : undefined;
  const tipeHarga =
    params.tipeHarga && params.tipeHarga !== "ALL"
      ? params.tipeHarga
      : undefined;
  const memberId =
    params.memberId && params.memberId !== "ALL" ? params.memberId : undefined;

  const [items, kasirList, memberList] = await Promise.all([
    getLaporanPenjualan({ start, end, kasirId, tipeHarga, memberId }),
    prisma.user.findMany({
      where: { role: "KASIR" },
      select: { id: true, nama: true },
    }),
    listMember(),
  ]);

  const exportParams = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    ...(kasirId ? { kasirId } : {}),
    ...(tipeHarga ? { tipeHarga } : {}),
    ...(memberId ? { memberId } : {}),
  });

  const data = items.map((item) => ({
    id: item.id,
    nomorTransaksi: item.transaksi.nomorTransaksi,
    createdAt: item.transaksi.createdAt.toISOString(),
    produkNama: item.produk.nama,
    produkSku: item.produk.sku,
    qty: item.qty,
    hargaSatuan: Number(item.hargaSatuan),
    tipeHarga: item.tipeHarga,
    kasirNama: item.transaksi.kasir.nama,
    memberNama: item.transaksi.member?.nama ?? null,
    subtotal: Number(item.subtotal),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laporan Penjualan</h1>
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
          href={`/api/laporan/penjualan/export?${exportParams.toString()}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilter />

        <form method="GET" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="range" value={params.range ?? "7"} />
          {params.start && (
            <input type="hidden" name="start" value={params.start} />
          )}
          {params.end && <input type="hidden" name="end" value={params.end} />}

          <Select name="kasirId" defaultValue={params.kasirId ?? "ALL"}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Kasir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kasir</SelectItem>
              {kasirList.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select name="tipeHarga" defaultValue={params.tipeHarga ?? "ALL"}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tipe Harga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="RITEL">Ritel</SelectItem>
              <SelectItem value="GROSIR">Grosir</SelectItem>
              <SelectItem value="KHUSUS">Khusus</SelectItem>
            </SelectContent>
          </Select>

          <Select name="memberId" defaultValue={params.memberId ?? "ALL"}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Member</SelectItem>
              {memberList.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" size="sm" variant="outline">
            Terapkan Filter
          </Button>
        </form>
      </div>

      <LaporanPenjualanTable data={data} />
    </div>
  );
}
