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

type LogRow = {
  id: string;
  createdAt: string;
  hargaLama: number | null;
  hargaBaru: number;
  diubahOlehNama: string;
};

export function HargaKhususLogTable({ data }: { data: LogRow[] }) {
  const {
    query,
    setQuery,
    pageRows,
    page,
    totalPages,
    totalFiltered,
    setPage,
  } = useTableSearch(data, (row, q) =>
    row.diubahOlehNama.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama yang mengubah..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Harga Lama</TableHead>
            <TableHead>Harga Baru</TableHead>
            <TableHead>Diubah Oleh</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="text-xs">
                {new Date(l.createdAt).toLocaleString("id-ID")}
              </TableCell>
              <TableCell>
                {l.hargaLama ? formatRupiah(l.hargaLama) : "-"}
              </TableCell>
              <TableCell>{formatRupiah(l.hargaBaru)}</TableCell>
              <TableCell>{l.diubahOlehNama}</TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Tidak ada histori yang cocok.
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
