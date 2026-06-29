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
import { createMemberAction, updateMemberAction } from "./actions";

type Member = {
  id: string;
  nama: string;
  noHp: string;
  email: string | null;
  alamat: string | null;
  catatan: string | null;
};

export function MemberDialog({ member }: { member?: Member }) {
  const [open, setOpen] = useState(false);
  const action = member ? updateMemberAction : createMemberAction;
  const { state, pending, handleSubmit } = useServerForm(action, () =>
    setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant={member ? "outline" : "default"} />}
      >
        {member ? "Edit" : "Tambah Member"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit Member" : "Tambah Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {member && <input type="hidden" name="id" value={member.id} />}
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" defaultValue={member?.nama} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noHp">No. HP</Label>
            <Input id="noHp" name="noHp" defaultValue={member?.noHp} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={member?.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              name="alamat"
              defaultValue={member?.alamat ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Input
              id="catatan"
              name="catatan"
              defaultValue={member?.catatan ?? ""}
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
