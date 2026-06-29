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
import { SupplierDialog } from "./supplier-dialog";
import { ToggleSupplierButton } from "./toggle-button";

type Supplier = {
  id: string;
  nama: string;
  kontakPerson: string | null;
  telepon: string | null;
  alamat: string | null;
  aktif: boolean;
};

export function SupplierTable({
  data,
  isAdmin,
}: {
  data: Supplier[];
  isAdmin: boolean;
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
      row.nama.toLowerCase().includes(q) ||
      (row.kontakPerson ?? "").toLowerCase().includes(q) ||
      (row.telepon ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, kontak, atau telepon..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kontak Person</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.nama}</TableCell>
              <TableCell>{s.kontakPerson ?? "-"}</TableCell>
              <TableCell>{s.telepon ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={s.aktif ? "success" : "secondary"}>
                  {s.aktif ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell className="flex justify-end gap-2">
                  <SupplierDialog supplier={s} />
                  <ToggleSupplierButton id={s.id} aktif={s.aktif} />
                </TableCell>
              )}
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Tidak ada supplier yang cocok.
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
