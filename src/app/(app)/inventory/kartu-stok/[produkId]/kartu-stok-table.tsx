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

type KartuStok = {
  id: string;
  createdAt: string;
  jenisPergerakan: string;
  qty: number;
  stokSebelum: number;
  stokSesudah: number;
  referensiTipe: string;
  userNama: string;
  catatan: string | null;
};

export function KartuStokTable({ data }: { data: KartuStok[] }) {
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
      row.jenisPergerakan.toLowerCase().includes(q) ||
      row.referensiTipe.toLowerCase().includes(q) ||
      row.userNama.toLowerCase().includes(q) ||
      (row.catatan ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari jenis, referensi, user, atau catatan..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Stok Sebelum</TableHead>
            <TableHead>Stok Sesudah</TableHead>
            <TableHead>Referensi</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((k) => (
            <TableRow key={k.id}>
              <TableCell className="text-xs">
                {new Date(k.createdAt).toLocaleString("id-ID")}
              </TableCell>
              <TableCell>{k.jenisPergerakan.replace("_", " ")}</TableCell>
              <TableCell
                className={k.qty < 0 ? "text-destructive" : "text-green-600"}
              >
                {k.qty > 0 ? `+${k.qty}` : k.qty}
              </TableCell>
              <TableCell>{k.stokSebelum}</TableCell>
              <TableCell>{k.stokSesudah}</TableCell>
              <TableCell className="text-xs">{k.referensiTipe}</TableCell>
              <TableCell>{k.userNama}</TableCell>
              <TableCell>{k.catatan ?? "-"}</TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
                Tidak ada pergerakan stok yang cocok.
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
