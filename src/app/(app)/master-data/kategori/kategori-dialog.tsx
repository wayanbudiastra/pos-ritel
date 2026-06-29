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
import { createKategoriAction, updateKategoriAction } from "./actions";

type Kategori = { id: string; nama: string };

export function KategoriDialog({ kategori }: { kategori?: Kategori }) {
  const [open, setOpen] = useState(false);
  const action = kategori ? updateKategoriAction : createKategoriAction;
  const { state, pending, handleSubmit } = useServerForm(action, () =>
    setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={kategori ? "outline" : "default"} size="sm" />}
      >
        {kategori ? "Edit" : "Tambah Kategori"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kategori ? "Edit Kategori" : "Tambah Kategori"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {kategori && <input type="hidden" name="id" value={kategori.id} />}
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Kategori</Label>
            <Input
              id="nama"
              name="nama"
              defaultValue={kategori?.nama}
              required
            />
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
