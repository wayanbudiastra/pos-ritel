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
import { createAkunAction, updateAkunAction } from "./actions";

type Akun = {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  saldoNormal: string;
};

const TIPE_OPTIONS = [
  { value: "ASET", label: "Aset" },
  { value: "LIABILITAS", label: "Liabilitas" },
  { value: "EKUITAS", label: "Ekuitas" },
  { value: "PENDAPATAN", label: "Pendapatan" },
  { value: "BEBAN", label: "Beban" },
  { value: "HPP", label: "HPP" },
];

export function AkunDialog({ akun }: { akun?: Akun }) {
  const [open, setOpen] = useState(false);
  const action = akun ? updateAkunAction : createAkunAction;
  const { state, pending, handleSubmit } = useServerForm(action, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={akun ? "outline" : "default"} size="sm" />}>
        {akun ? "Edit" : "Tambah Akun"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{akun ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {akun && <input type="hidden" name="id" value={akun.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Akun</Label>
              <Input id="kode" name="kode" placeholder="1-1000" defaultValue={akun?.kode} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Akun</Label>
              <Input id="nama" name="nama" defaultValue={akun?.nama} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe Akun</Label>
              <Select name="tipe" defaultValue={akun?.tipe ?? "ASET"}>
                <SelectTrigger id="tipe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saldoNormal">Saldo Normal</Label>
              <Select name="saldoNormal" defaultValue={akun?.saldoNormal ?? "DEBIT"}>
                <SelectTrigger id="saldoNormal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                  <SelectItem value="KREDIT">Kredit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
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
