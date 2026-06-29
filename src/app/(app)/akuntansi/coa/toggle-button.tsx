"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleAkunAction } from "./actions";

export function ToggleAkunButton({ id, aktif }: { id: string; aktif: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleAkunAction(id, aktif);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(aktif ? "Akun dinonaktifkan." : "Akun diaktifkan.");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={aktif ? "text-destructive" : ""}
      disabled={pending}
      onClick={handleToggle}
    >
      {aktif ? "Nonaktifkan" : "Aktifkan"}
    </Button>
  );
}
