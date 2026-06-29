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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type PoRow = {
  poId: string;
  nomorPO: string;
  supplier: string;
  status: string;
  totalNilai: number;
  jumlahGrn: number;
  adaDiskrepansi: boolean;
  createdAt: string;
};

export function LaporanPembelianTable({ data }: { data: PoRow[] }) {
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
      row.supplier.toLowerCase().includes(q),
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
            <TableHead>Status</TableHead>
            <TableHead>Total Nilai</TableHead>
            <TableHead>Jumlah GRN</TableHead>
            <TableHead>Diskrepansi</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((po) => (
            <TableRow key={po.poId}>
              <TableCell>{po.nomorPO}</TableCell>
              <TableCell>{po.supplier}</TableCell>
              <TableCell>
                <Badge variant="secondary">{po.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>{formatRupiah(po.totalNilai)}</TableCell>
              <TableCell>{po.jumlahGrn}</TableCell>
              <TableCell>
                {po.adaDiskrepansi ? (
                  <Badge variant="destructive">Ada</Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-xs">
                {new Date(po.createdAt).toLocaleDateString("id-ID")}
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                Tidak ada data yang cocok.
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
