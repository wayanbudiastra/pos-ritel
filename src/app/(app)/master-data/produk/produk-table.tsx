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
import { ProdukDialog } from "./produk-dialog";
import { ToggleProdukButton } from "./toggle-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Kategori = { id: string; nama: string };
type Produk = {
  id: string;
  sku: string;
  barcode: string | null;
  nama: string;
  kategoriId: string;
  kategoriNama: string;
  satuan: string;
  hpp: number;
  hargaRitel: number;
  hargaGrosir: number;
  minQtyGrosir: number;
  stok: number;
  stokMinimum: number;
  aktif: boolean;
};

export function ProdukTable({
  data,
  kategoriList,
  isAdmin,
}: {
  data: Produk[];
  kategoriList: Kategori[];
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
      row.sku.toLowerCase().includes(q) ||
      row.kategoriNama.toLowerCase().includes(q) ||
      (row.barcode ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, SKU, barcode, atau kategori..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>HPP</TableHead>
            <TableHead>Harga Ritel</TableHead>
            <TableHead>Harga Grosir</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.sku}</TableCell>
              <TableCell>{p.nama}</TableCell>
              <TableCell>{p.kategoriNama}</TableCell>
              <TableCell>{formatRupiah(p.hpp)}</TableCell>
              <TableCell>{formatRupiah(p.hargaRitel)}</TableCell>
              <TableCell>{formatRupiah(p.hargaGrosir)}</TableCell>
              <TableCell>
                {p.stok}
                {p.stok <= p.stokMinimum && (
                  <Badge variant="destructive" className="ml-2">
                    Reorder
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={p.aktif ? "success" : "secondary"}>
                  {p.aktif ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell className="flex justify-end gap-2">
                  <ProdukDialog
                    kategoriList={kategoriList}
                    produk={{
                      id: p.id,
                      sku: p.sku,
                      barcode: p.barcode,
                      nama: p.nama,
                      kategoriId: p.kategoriId,
                      satuan: p.satuan,
                      hpp: String(p.hpp),
                      hargaRitel: String(p.hargaRitel),
                      hargaGrosir: String(p.hargaGrosir),
                      minQtyGrosir: p.minQtyGrosir,
                      stokMinimum: p.stokMinimum,
                    }}
                  />
                  <ToggleProdukButton id={p.id} aktif={p.aktif} />
                </TableCell>
              )}
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground"
              >
                Tidak ada produk yang cocok.
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
