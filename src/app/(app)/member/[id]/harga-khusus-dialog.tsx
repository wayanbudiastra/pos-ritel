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
import { upsertHargaKhususAction } from "./actions";

type Produk = {
  id: string;
  nama: string;
  hargaRitel: string;
  hargaGrosir: string;
  hpp: string;
};

export function HargaKhususDialog({
  memberId,
  produkList,
}: {
  memberId: string;
  produkList: Produk[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmBelowHpp, setConfirmBelowHpp] = useState(false);
  const [selectedProdukId, setSelectedProdukId] = useState<string>("");
  const { state, pending, handleSubmit } = useServerForm(
    upsertHargaKhususAction,
    (result) => {
      if (!result.warning) {
        setOpen(false);
        setConfirmBelowHpp(false);
      }
    },
  );

  const selectedProduk = produkList.find((p) => p.id === selectedProdukId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        Tambah Harga Khusus
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Harga Khusus Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="memberId" value={memberId} />
          <input
            type="hidden"
            name="konfirmasiDiBawahHpp"
            value={confirmBelowHpp ? "true" : ""}
          />
          <div className="space-y-2">
            <Label htmlFor="produkId">Produk</Label>
            <Select
              name="produkId"
              value={selectedProdukId}
              onValueChange={(v) => setSelectedProdukId(v ?? "")}
            >
              <SelectTrigger id="produkId">
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {produkList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProduk && (
            <p className="text-xs text-muted-foreground">
              HPP: {selectedProduk.hpp} · Ritel: {selectedProduk.hargaRitel} ·
              Grosir: {selectedProduk.hargaGrosir}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="hargaKhusus">Harga Khusus</Label>
            <Input
              id="hargaKhusus"
              name="hargaKhusus"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalMulai">Tanggal Mulai (opsional)</Label>
              <Input id="tanggalMulai" name="tanggalMulai" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalBerakhir">
                Tanggal Berakhir (opsional)
              </Label>
              <Input id="tanggalBerakhir" name="tanggalBerakhir" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Input id="catatan" name="catatan" />
          </div>
          {state?.warning && (
            <div className="space-y-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
              <p>{state.warning}</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirmBelowHpp}
                  onChange={(e) => setConfirmBelowHpp(e.target.checked)}
                />
                Tetap simpan di bawah HPP
              </label>
            </div>
          )}
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
