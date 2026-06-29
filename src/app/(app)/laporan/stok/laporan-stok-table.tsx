"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type StokRow = {
  produkId: string;
  sku: string;
  nama: string;
  kategori: string;
  stok: number;
  stokMinimum: number;
  hpp: number;
  nilaiStok: number;
  perluReorder: boolean;
};

export function LaporanStokTable({ data }: { data: StokRow[] }) {
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
      row.sku.toLowerCase().includes(q) ||
      row.kategori.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, SKU, atau kategori..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Stok Minimum</TableHead>
            <TableHead>HPP</TableHead>
            <TableHead>Nilai Stok</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Kartu Stok</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((item) => (
            <TableRow key={item.produkId}>
              <TableCell>{item.sku}</TableCell>
              <TableCell>{item.nama}</TableCell>
              <TableCell>{item.kategori}</TableCell>
              <TableCell>{item.stok}</TableCell>
              <TableCell>{item.stokMinimum}</TableCell>
              <TableCell>{formatRupiah(item.hpp)}</TableCell>
              <TableCell>{formatRupiah(item.nilaiStok)}</TableCell>
              <TableCell>
                {item.perluReorder && (
                  <Badge variant="destructive">Perlu Reorder</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/inventory/kartu-stok/${item.produkId}`} />
                  }
                >
                  Lihat
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground"
              >
                Tidak ada produk yang cocok.
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
