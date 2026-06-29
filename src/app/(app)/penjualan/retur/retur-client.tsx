"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerForm } from "@/hooks/use-server-form";
import { searchTransaksiAction, returItemAction } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type TransaksiItem = {
  id: string;
  produkNama: string;
  qty: number;
  qtyRetur: number;
  hargaSatuan: number;
};

type Transaksi = {
  id: string;
  nomorTransaksi: string;
  createdAt: string;
  kasirNama: string;
  memberNama: string | null;
  items: TransaksiItem[];
};

export function ReturClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Transaksi[]>([]);
  const [selectedItem, setSelectedItem] = useState<TransaksiItem | null>(null);

  const { state, pending, handleSubmit } = useServerForm(
    returItemAction,
    () => {
      toast.success("Retur berhasil disimpan, stok telah dikembalikan.");
      setSelectedItem(null);
      searchTransaksiAction(query).then(setResults);
    },
  );

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      searchTransaksiAction(query).then(setResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const visibleResults = query.trim().length >= 2 ? results : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Retur Penjualan</h1>

      <div className="space-y-2">
        <Label>Cari No. Transaksi</Label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="TRX-20260628-0001"
        />
      </div>

      {visibleResults.map((t) => (
        <div key={t.id} className="space-y-2 rounded-md border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t.nomorTransaksi}</span>
            <span className="text-muted-foreground">
              {new Date(t.createdAt).toLocaleString("id-ID")} · Kasir:{" "}
              {t.kasirNama}
              {t.memberNama && ` · Member: ${t.memberNama}`}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Sudah Retur</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produkNama}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.qtyRetur}</TableCell>
                  <TableCell>{formatRupiah(item.hargaSatuan)}</TableCell>
                  <TableCell>
                    {item.qtyRetur < item.qty && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedItem(item)}
                      >
                        Retur
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {selectedItem && (
        <div className="space-y-4 rounded-md border p-4">
          <h2 className="font-medium">Retur: {selectedItem.produkNama}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="hidden"
              name="transaksiItemId"
              value={selectedItem.id}
            />
            <div className="space-y-2">
              <Label htmlFor="qty">
                Qty Retur (maks. {selectedItem.qty - selectedItem.qtyRetur})
              </Label>
              <Input
                id="qty"
                name="qty"
                type="number"
                min={1}
                max={selectedItem.qty - selectedItem.qtyRetur}
                defaultValue={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alasan">Alasan Retur</Label>
              <Input id="alasan" name="alasan" required />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan Retur"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedItem(null)}
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
