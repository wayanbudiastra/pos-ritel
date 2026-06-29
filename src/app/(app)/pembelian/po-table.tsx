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
import { PoStatusActions } from "./po-status-actions";
import type { StatusPO } from "@prisma/client";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Po = {
  id: string;
  nomorPO: string;
  supplierNama: string;
  totalNilai: number;
  status: StatusPO;
};

export function PoTable({
  data,
  isAdmin,
  isGudang,
}: {
  data: Po[];
  isAdmin: boolean;
  isGudang: boolean;
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
      row.nomorPO.toLowerCase().includes(q) ||
      row.supplierNama.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. PO atau supplier..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. PO</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Total Nilai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((po) => (
            <TableRow key={po.id}>
              <TableCell>{po.nomorPO}</TableCell>
              <TableCell>{po.supplierNama}</TableCell>
              <TableCell>{formatRupiah(po.totalNilai)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{po.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/pembelian/${po.id}`} />}
                  >
                    Detail
                  </Button>
                  <PoStatusActions
                    id={po.id}
                    status={po.status}
                    isAdmin={isAdmin}
                    isGudang={isGudang}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Tidak ada PO yang cocok.
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
