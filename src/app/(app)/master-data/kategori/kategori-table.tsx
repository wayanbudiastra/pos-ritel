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
import { KategoriDialog } from "./kategori-dialog";
import { DeleteKategoriButton } from "./delete-button";

type Kategori = { id: string; nama: string; _count: { produk: number } };

export function KategoriTable({
  data,
  isAdmin,
}: {
  data: Kategori[];
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
  } = useTableSearch(data, (row, q) => row.nama.toLowerCase().includes(q));

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama kategori..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Kategori</TableHead>
            <TableHead>Jumlah Produk</TableHead>
            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((k) => (
            <TableRow key={k.id}>
              <TableCell>{k.nama}</TableCell>
              <TableCell>{k._count.produk}</TableCell>
              {isAdmin && (
                <TableCell className="flex justify-end gap-2">
                  <KategoriDialog kategori={k} />
                  <DeleteKategoriButton id={k.id} nama={k.nama} />
                </TableCell>
              )}
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                Tidak ada kategori yang cocok.
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
