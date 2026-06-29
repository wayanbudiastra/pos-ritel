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
import { createSupplierAction, updateSupplierAction } from "./actions";

type Supplier = {
  id: string;
  nama: string;
  kontakPerson: string | null;
  telepon: string | null;
  alamat: string | null;
};

export function SupplierDialog({ supplier }: { supplier?: Supplier }) {
  const [open, setOpen] = useState(false);
  const action = supplier ? updateSupplierAction : createSupplierAction;
  const { state, pending, handleSubmit } = useServerForm(action, () =>
    setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={supplier ? "outline" : "default"} size="sm" />}
      >
        {supplier ? "Edit" : "Tambah Supplier"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Edit Supplier" : "Tambah Supplier"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {supplier && <input type="hidden" name="id" value={supplier.id} />}
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Supplier</Label>
            <Input
              id="nama"
              name="nama"
              defaultValue={supplier?.nama}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakPerson">Kontak Person</Label>
            <Input
              id="kontakPerson"
              name="kontakPerson"
              defaultValue={supplier?.kontakPerson ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telepon">Telepon</Label>
            <Input
              id="telepon"
              name="telepon"
              defaultValue={supplier?.telepon ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              name="alamat"
              defaultValue={supplier?.alamat ?? ""}
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
