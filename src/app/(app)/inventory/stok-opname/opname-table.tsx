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

type Opname = {
  id: string;
  nomorOpname: string;
  lingkupLabel: string;
  jumlahItem: number;
  status: string;
  dibuatOlehNama: string;
};

export function OpnameTable({ data }: { data: Opname[] }) {
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
      row.nomorOpname.toLowerCase().includes(q) ||
      row.lingkupLabel.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. opname atau lingkup..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Opname</TableHead>
            <TableHead>Lingkup</TableHead>
            <TableHead>Jumlah Item</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat Oleh</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.nomorOpname}</TableCell>
              <TableCell>{o.lingkupLabel}</TableCell>
              <TableCell>{o.jumlahItem}</TableCell>
              <TableCell>
                <Badge variant="secondary">{o.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>{o.dibuatOlehNama}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/inventory/stok-opname/${o.id}`} />}
                >
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Tidak ada sesi yang cocok.
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
