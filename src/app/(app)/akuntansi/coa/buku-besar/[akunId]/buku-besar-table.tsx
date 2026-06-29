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

type Item = {
  id: string;
  jurnalEntryId: string;
  tanggal: string;
  nomorJurnal: string;
  keterangan: string | null;
  sumber: string;
  debit: number;
  kredit: number;
  saldoBerjalan: number;
};

export function BukuBesarTable({ data }: { data: Item[] }) {
  const { query, setQuery, pageRows, page, totalPages, totalFiltered, setPage } = useTableSearch(
    data,
    (row, q) =>
      row.nomorJurnal.toLowerCase().includes(q) || (row.keterangan ?? "").toLowerCase().includes(q)
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. jurnal atau keterangan..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>No. Jurnal</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Kredit</TableHead>
            <TableHead>Saldo Berjalan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xs">{new Date(item.tanggal).toLocaleDateString("id-ID")}</TableCell>
              <TableCell>
                <Link className="underline" href={`/akuntansi/jurnal/${item.jurnalEntryId}`}>
                  {item.nomorJurnal}
                </Link>{" "}
                <Badge variant="secondary" className="ml-1">
                  {item.sumber === "OTOMATIS" ? "Otomatis" : "Manual"}
                </Badge>
              </TableCell>
              <TableCell>{item.keterangan ?? "-"}</TableCell>
              <TableCell>{item.debit > 0 ? formatRupiah(item.debit) : "-"}</TableCell>
              <TableCell>{item.kredit > 0 ? formatRupiah(item.kredit) : "-"}</TableCell>
              <TableCell className="font-medium">{formatRupiah(item.saldoBerjalan)}</TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada mutasi pada akun ini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} total={totalFiltered} onPageChange={setPage} />
    </div>
  );
}
