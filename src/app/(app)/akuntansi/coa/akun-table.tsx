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
import { AkunDialog } from "./akun-dialog";
import { ToggleAkunButton } from "./toggle-button";

const TIPE_LABEL: Record<string, string> = {
  ASET: "Aset",
  LIABILITAS: "Liabilitas",
  EKUITAS: "Ekuitas",
  PENDAPATAN: "Pendapatan",
  BEBAN: "Beban",
  HPP: "HPP",
};

type Akun = {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  saldoNormal: string;
  aktif: boolean;
};

export function AkunTable({ data, isAdmin }: { data: Akun[]; isAdmin: boolean }) {
  const { query, setQuery, pageRows, page, totalPages, totalFiltered, setPage } = useTableSearch(
    data,
    (row, q) =>
      row.kode.toLowerCase().includes(q) ||
      row.nama.toLowerCase().includes(q) ||
      TIPE_LABEL[row.tipe].toLowerCase().includes(q)
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari kode, nama, atau tipe akun..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama Akun</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Saldo Normal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.kode}</TableCell>
              <TableCell>{a.nama}</TableCell>
              <TableCell>{TIPE_LABEL[a.tipe]}</TableCell>
              <TableCell>{a.saldoNormal === "DEBIT" ? "Debit" : "Kredit"}</TableCell>
              <TableCell>
                <Badge variant={a.aktif ? "success" : "secondary"}>
                  {a.aktif ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/akuntansi/coa/buku-besar/${a.id}`} />}
                >
                  Buku Besar
                </Button>
                {isAdmin && (
                  <>
                    <AkunDialog akun={a} />
                    <ToggleAkunButton id={a.id} aktif={a.aktif} />
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Tidak ada akun yang cocok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} total={totalFiltered} onPageChange={setPage} />
    </div>
  );
}
