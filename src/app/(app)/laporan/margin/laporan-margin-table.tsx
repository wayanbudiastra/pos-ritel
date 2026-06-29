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

type MarginRow = {
  produkId: string;
  nama: string;
  kategori: string;
  qty: number;
  penjualan: number;
  modal: number;
  margin: number;
};

export function LaporanMarginTable({ data }: { data: MarginRow[] }) {
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
      row.nama.toLowerCase().includes(q) ||
      row.kategori.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari produk atau kategori..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Qty Terjual</TableHead>
            <TableHead>Penjualan</TableHead>
            <TableHead>Modal (HPP)</TableHead>
            <TableHead>Margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((item) => (
            <TableRow key={item.produkId}>
              <TableCell>{item.nama}</TableCell>
              <TableCell>{item.kategori}</TableCell>
              <TableCell>{item.qty}</TableCell>
              <TableCell>{formatRupiah(item.penjualan)}</TableCell>
              <TableCell>{formatRupiah(item.modal)}</TableCell>
              <TableCell>{formatRupiah(item.margin)}</TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
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
