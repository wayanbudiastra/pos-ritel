"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerForm } from "@/hooks/use-server-form";
import {
  createPoAction,
  searchProdukForPoAction,
  getHargaBeliTerakhirAction,
} from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Supplier = { id: string; nama: string };
type ProdukOption = { id: string; sku: string; nama: string; hpp: number };
type Item = {
  produkId: string;
  nama: string;
  qtyPesan: number;
  hargaBeli: number;
  referensi: number[];
};

export function PoFormDialog({ supplierList }: { supplierList: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProdukOption[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const {
    state,
    pending,
    handleSubmit: submitForm,
  } = useServerForm(createPoAction, () => {
    toast.success("PO berhasil dibuat sebagai Draft.");
    setOpen(false);
    setSupplierId("");
    setItems([]);
  });

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      searchProdukForPoAction(query).then(setResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const visibleResults = query.trim().length >= 2 ? results : [];

  async function addItem(produk: ProdukOption) {
    if (items.some((i) => i.produkId === produk.id)) {
      toast.error("Produk sudah ada di daftar.");
      return;
    }
    const referensi = await getHargaBeliTerakhirAction(produk.id);
    setItems((prev) => [
      ...prev,
      {
        produkId: produk.id,
        nama: produk.nama,
        qtyPesan: 1,
        hargaBeli: referensi[0] ?? produk.hpp,
        referensi,
      },
    ]);
    setQuery("");
    setResults([]);
  }

  function updateItem(
    produkId: string,
    field: "qtyPesan" | "hargaBeli",
    value: number,
  ) {
    setItems((prev) =>
      prev.map((i) => (i.produkId === produkId ? { ...i, [field]: value } : i)),
    );
  }

  function removeItem(produkId: string) {
    setItems((prev) => prev.filter((i) => i.produkId !== produkId));
  }

  const totalNilai = items.reduce(
    (sum, i) => sum + i.qtyPesan * i.hargaBeli,
    0,
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!supplierId) {
      e.preventDefault();
      toast.error("Pilih supplier terlebih dahulu.");
      return;
    }
    if (items.length === 0) {
      e.preventDefault();
      toast.error("Tambahkan minimal 1 produk.");
      return;
    }
    submitForm(e);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Buat PO</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="hidden"
            name="payload"
            value={JSON.stringify({
              supplierId,
              items: items.map((i) => ({
                produkId: i.produkId,
                qtyPesan: i.qtyPesan,
                hargaBeli: i.hargaBeli,
              })),
            })}
          />
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={supplierId}
              onValueChange={(v) => setSupplierId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier" />
              </SelectTrigger>
              <SelectContent>
                {supplierList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tambah Produk</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama / SKU produk..."
            />
            {visibleResults.length > 0 && (
              <div className="rounded-md border">
                {visibleResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>
                      {p.nama}{" "}
                      <span className="text-muted-foreground">({p.sku})</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Qty Pesan</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.produkId}>
                  <TableCell>
                    {item.nama}
                    {item.referensi.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {item.referensi.map(formatRupiah).join(", ")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={item.qtyPesan}
                      onChange={(e) =>
                        updateItem(
                          item.produkId,
                          "qtyPesan",
                          Number(e.target.value),
                        )
                      }
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={item.hargaBeli}
                      onChange={(e) =>
                        updateItem(
                          item.produkId,
                          "hargaBeli",
                          Number(e.target.value),
                        )
                      }
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    {formatRupiah(item.qtyPesan * item.hargaBeli)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.produkId)}
                    >
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada produk.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end font-semibold">
            Total: {formatRupiah(totalNilai)}
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan sebagai Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
