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
import { PenyesuaianDialog } from "./penyesuaian-dialog";

type Produk = {
  id: string;
  sku: string;
  nama: string;
  stok: number;
  stokMinimum: number;
};

export function InventoryTable({
  data,
  canAdjust,
}: {
  data: Produk[];
  canAdjust: boolean;
}) {
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
      row.nama.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau SKU..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Stok Minimum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.sku}</TableCell>
              <TableCell>{p.nama}</TableCell>
              <TableCell>{p.stok}</TableCell>
              <TableCell>{p.stokMinimum}</TableCell>
              <TableCell>
                {p.stok <= p.stokMinimum && (
                  <Badge variant="destructive">Perlu Reorder</Badge>
                )}
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/inventory/kartu-stok/${p.id}`} />}
                >
                  Kartu Stok
                </Button>
                {canAdjust && (
                  <PenyesuaianDialog produkId={p.id} produkNama={p.nama} />
                )}
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
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
