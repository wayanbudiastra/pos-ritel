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

type Transaksi = {
  id: string;
  nomorTransaksi: string;
  createdAt: string;
  jumlahItem: number;
  total: number;
};

export function RiwayatTransaksiTable({ data }: { data: Transaksi[] }) {
  const {
    query,
    setQuery,
    pageRows,
    page,
    totalPages,
    totalFiltered,
    setPage,
  } = useTableSearch(data, (row, q) =>
    row.nomorTransaksi.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari no. transaksi..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.nomorTransaksi}</TableCell>
              <TableCell className="text-xs">
                {new Date(t.createdAt).toLocaleString("id-ID")}
              </TableCell>
              <TableCell>{t.jumlahItem} item</TableCell>
              <TableCell>{formatRupiah(t.total)}</TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Tidak ada transaksi yang cocok.
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
