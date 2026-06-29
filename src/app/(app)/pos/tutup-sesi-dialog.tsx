"use client";

import { useActionState, useEffect, useState } from "react";
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
import { getRekapSesiAction, tutupSesiAction } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Rekap = {
  rekapPerMetode: Record<string, number>;
  totalTunai: number;
  totalTransaksi: number;
  totalPenjualan: number;
};

export function TutupSesiDialog({ sesiKasirId }: { sesiKasirId: string }) {
  const [open, setOpen] = useState(false);
  const [rekap, setRekap] = useState<Rekap | null>(null);
  const action = tutupSesiAction.bind(null, sesiKasirId);
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (open) {
      getRekapSesiAction(sesiKasirId).then(setRekap);
    }
  }, [open, sesiKasirId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Tutup Sesi
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tutup Sesi Kasir</DialogTitle>
        </DialogHeader>
        {rekap && (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p>Total Transaksi: {rekap.totalTransaksi}</p>
            <p>Total Penjualan: {formatRupiah(rekap.totalPenjualan)}</p>
            {Object.entries(rekap.rekapPerMetode).map(([metode, total]) => (
              <p key={metode}>
                {metode}: {formatRupiah(total)}
              </p>
            ))}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalKasAkhir">Total Kas Fisik Akhir</Label>
            <Input
              id="totalKasAkhir"
              name="totalKasAkhir"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Input id="catatan" name="catatan" />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menutup..." : "Tutup Sesi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
