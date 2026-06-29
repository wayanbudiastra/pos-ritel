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
import { quickCreateMemberAction } from "@/app/(app)/member/actions";
import { searchMemberAction } from "./actions";

type Member = { id: string; nama: string; noHp: string; kodeMember: string };

export function QuickMemberDialog({
  onSelect,
}: {
  onSelect: (member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    quickCreateMemberAction,
    undefined,
  );

  useEffect(() => {
    if (!open || !state || state.error) return;

    const noHp = (
      document.getElementById("quick-noHp") as HTMLInputElement | null
    )?.value;
    if (!noHp) return;

    searchMemberAction(noHp).then((results) => {
      const found = results.find((m) => m.noHp === noHp);
      if (found) onSelect(found);
      setOpen(false);
    });
  }, [state, open, onSelect]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Daftar Member Baru
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daftar Cepat Member</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-nama">Nama</Label>
            <Input id="quick-nama" name="nama" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-noHp">No. HP</Label>
            <Input id="quick-noHp" name="noHp" required />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Daftar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
