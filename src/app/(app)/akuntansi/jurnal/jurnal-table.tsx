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

type Jurnal = {
  id: string;
  nomorJurnal: string;
  tanggal: string;
  keterangan: string;
  sumber: string;
  status: string;
  totalDebit: number;
  dibuatOlehNama: string;
  sudahDibalik: boolean;
};

export function JurnalTable({ data }: { data: Jurnal[] }) {
  const { query, setQuery, pageRows, page, totalPages, totalFiltered, setPage } = useTableSearch(
    data,
    (row, q) =>
      row.nomorJurnal.toLowerCase().includes(q) ||
      row.keterangan.toLowerCase().includes(q) ||
      row.dibuatOlehNama.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. jurnal, keterangan, atau pembuat..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Jurnal</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Dibuat Oleh</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((j) => (
            <TableRow key={j.id}>
              <TableCell>{j.nomorJurnal}</TableCell>
              <TableCell className="text-xs">{new Date(j.tanggal).toLocaleDateString("id-ID")}</TableCell>
              <TableCell>{j.keterangan}</TableCell>
              <TableCell>
                <Badge variant="secondary">{j.sumber === "OTOMATIS" ? "Otomatis" : "Manual"}</Badge>
              </TableCell>
              <TableCell>{formatRupiah(j.totalDebit)}</TableCell>
              <TableCell>{j.dibuatOlehNama}</TableCell>
              <TableCell>
                {j.status === "DIBATALKAN" ? (
                  <Badge variant="destructive">Dibatalkan</Badge>
                ) : j.sudahDibalik ? (
                  <Badge variant="secondary">Sudah Dibalik</Badge>
                ) : (
                  <Badge variant="success">Posted</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" render={<Link href={`/akuntansi/jurnal/${j.id}`} />}>
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Tidak ada jurnal yang cocok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} total={totalFiltered} onPageChange={setPage} />
    </div>
  );
}
