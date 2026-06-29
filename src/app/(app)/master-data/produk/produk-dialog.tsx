"use client";

import { useState } from "react";
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
import { useServerForm } from "@/hooks/use-server-form";
import { createProdukAction, updateProdukAction } from "./actions";

type Kategori = { id: string; nama: string };
type Produk = {
  id: string;
  sku: string;
  barcode: string | null;
  nama: string;
  kategoriId: string;
  satuan: string;
  hpp: string;
  hargaRitel: string;
  hargaGrosir: string;
  minQtyGrosir: number;
  stokMinimum: number;
};

export function ProdukDialog({
  produk,
  kategoriList,
}: {
  produk?: Produk;
  kategoriList: Kategori[];
}) {
  const [open, setOpen] = useState(false);
  const action = produk ? updateProdukAction : createProdukAction;
  const { state, pending, handleSubmit } = useServerForm(action, () =>
    setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={produk ? "outline" : "default"} size="sm" />}
      >
        {produk ? "Edit" : "Tambah Produk"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{produk ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {produk && <input type="hidden" name="id" value={produk.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={produk?.sku} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                placeholder="Kosongkan untuk dibuat otomatis"
                defaultValue={produk?.barcode ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Produk</Label>
            <Input id="nama" name="nama" defaultValue={produk?.nama} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kategoriId">Kategori</Label>
              <Select name="kategoriId" defaultValue={produk?.kategoriId}>
                <SelectTrigger id="kategoriId">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="satuan">Satuan</Label>
              <Input
                id="satuan"
                name="satuan"
                placeholder="pcs, kg, dus"
                defaultValue={produk?.satuan}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hpp">HPP</Label>
              <Input
                id="hpp"
                name="hpp"
                type="number"
                step="0.01"
                min="0"
                defaultValue={produk?.hpp}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hargaRitel">Harga Ritel</Label>
              <Input
                id="hargaRitel"
                name="hargaRitel"
                type="number"
                step="0.01"
                min="0"
                defaultValue={produk?.hargaRitel}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hargaGrosir">Harga Grosir</Label>
              <Input
                id="hargaGrosir"
                name="hargaGrosir"
                type="number"
                step="0.01"
                min="0"
                defaultValue={produk?.hargaGrosir}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minQtyGrosir">Min. Qty Grosir</Label>
              <Input
                id="minQtyGrosir"
                name="minQtyGrosir"
                type="number"
                min="1"
                defaultValue={produk?.minQtyGrosir ?? 1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stokMinimum">Stok Minimum</Label>
              <Input
                id="stokMinimum"
                name="stokMinimum"
                type="number"
                min="0"
                defaultValue={produk?.stokMinimum ?? 0}
                required
              />
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
