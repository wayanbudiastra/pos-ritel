"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTableSearch } from "@/hooks/use-table-search";
import { TablePagination } from "@/components/shared/table-pagination";

type Grn = {
  id: string;
  nomorGRN: string;
  nomorPO: string;
  supplierNama: string;
  diterimaOlehNama: string;
  createdAt: string;
  adaDiskrepansi: boolean;
};

export function GrnTable({ data }: { data: Grn[] }) {
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
      row.nomorGRN.toLowerCase().includes(q) ||
      row.nomorPO.toLowerCase().includes(q) ||
      row.supplierNama.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. GRN, no. PO, atau supplier..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. GRN</TableHead>
            <TableHead>No. PO</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Diterima Oleh</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Diskrepansi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{g.nomorGRN}</TableCell>
              <TableCell>{g.nomorPO}</TableCell>
              <TableCell>{g.supplierNama}</TableCell>
              <TableCell>{g.diterimaOlehNama}</TableCell>
              <TableCell className="text-xs">
                {new Date(g.createdAt).toLocaleString("id-ID")}
              </TableCell>
              <TableCell>
                {g.adaDiskrepansi ? (
                  <Badge variant="destructive">Ada</Badge>
                ) : (
                  "-"
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
                Tidak ada GRN yang cocok.
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
