"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useTableSearch } from "@/hooks/use-table-search";
import { TablePagination } from "@/components/shared/table-pagination";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Item = {
  id: string;
  nomorTransaksi: string;
  createdAt: string;
  produkNama: string;
  produkSku: string;
  qty: number;
  hargaSatuan: number;
  tipeHarga: string;
  kasirNama: string;
  memberNama: string | null;
  subtotal: number;
};

export function LaporanPenjualanTable({ data }: { data: Item[] }) {
  const {
    query,
    setQuery,
    pageRows,
    page,
    totalPages,
    totalFiltered,
    setPage,
  } = useTableSearch(
    data,
    (row, q) =>
      row.nomorTransaksi.toLowerCase().includes(q) ||
      row.produkNama.toLowerCase().includes(q) ||
      row.produkSku.toLowerCase().includes(q) ||
      row.kasirNama.toLowerCase().includes(q) ||
      (row.memberNama ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. transaksi, produk, kasir, atau member..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Tipe Harga</TableHead>
            <TableHead>Kasir</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nomorTransaksi}</TableCell>
              <TableCell className="text-xs">
                {new Date(item.createdAt).toLocaleString("id-ID")}
              </TableCell>
              <TableCell>
                {item.produkNama}{" "}
                <span className="text-xs text-muted-foreground">
                  ({item.produkSku})
                </span>
              </TableCell>
              <TableCell>{item.qty}</TableCell>
              <TableCell>{formatRupiah(item.hargaSatuan)}</TableCell>
              <TableCell>{item.tipeHarga}</TableCell>
              <TableCell>{item.kasirNama}</TableCell>
              <TableCell>{item.memberNama ?? "-"}</TableCell>
              <TableCell>{formatRupiah(item.subtotal)}</TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground"
              >
                Tidak ada data yang cocok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={totalFiltered}
        onPageChange={setPage}
      />
    </div>
  );
}
