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
import { NonaktifkanHkButton } from "./nonaktifkan-hk-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type HargaKhusus = {
  id: string;
  produkNama: string;
  hargaKhusus: number;
  tanggalMulai: string | null;
  tanggalBerakhir: string | null;
  status: "AKTIF" | "NONAKTIF";
};

export function HargaKhususTable({
  data,
  memberId,
  isAdmin,
}: {
  data: HargaKhusus[];
  memberId: string;
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
  } = useTableSearch(data, (row, q) =>
    row.produkNama.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari produk..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Harga Khusus</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((h) => (
            <TableRow key={h.id}>
              <TableCell>{h.produkNama}</TableCell>
              <TableCell>{formatRupiah(h.hargaKhusus)}</TableCell>
              <TableCell className="text-xs">
                {h.tanggalMulai
                  ? new Date(h.tanggalMulai).toLocaleDateString("id-ID")
                  : "-"}{" "}
                s/d{" "}
                {h.tanggalBerakhir
                  ? new Date(h.tanggalBerakhir).toLocaleDateString("id-ID")
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={h.status === "AKTIF" ? "success" : "secondary"}>
                  {h.status}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  {h.status === "AKTIF" && (
                    <NonaktifkanHkButton id={h.id} memberId={memberId} />
                  )}
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
                Tidak ada harga khusus yang cocok.
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
