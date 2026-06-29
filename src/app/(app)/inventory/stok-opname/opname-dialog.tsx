"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerForm } from "@/hooks/use-server-form";
import { createOpnameAction } from "./actions";

type Kategori = { id: string; nama: string };

export function OpnameDialog({ kategoriList }: { kategoriList: Kategori[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { state, pending, handleSubmit } = useServerForm(
    createOpnameAction,
    () => {
      setOpen(false);
      router.refresh();
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        Buat Sesi Opname
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Sesi Stok Opname</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Lingkup</Label>
            <Select name="lingkup" defaultValue="SEMUA">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Seluruh Produk</SelectItem>
                {kategoriList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    Kategori: {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Membuat..." : "Buat Sesi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
