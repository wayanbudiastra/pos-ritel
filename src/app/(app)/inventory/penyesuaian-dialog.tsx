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
import { useServerForm } from "@/hooks/use-server-form";
import { penyesuaianManualAction } from "./actions";

export function PenyesuaianDialog({
  produkId,
  produkNama,
}: {
  produkId: string;
  produkNama: string;
}) {
  const [open, setOpen] = useState(false);
  const { state, pending, handleSubmit } = useServerForm(
    penyesuaianManualAction,
    () => setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Sesuaikan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok Manual: {produkNama}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="produkId" value={produkId} />
          <div className="space-y-2">
            <Label htmlFor="qty">Qty (+ untuk masuk, - untuk keluar)</Label>
            <Input id="qty" name="qty" type="number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alasan">Alasan</Label>
            <Input id="alasan" name="alasan" required />
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
