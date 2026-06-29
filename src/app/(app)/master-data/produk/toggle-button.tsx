"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleProdukAction } from "./actions";

export function ToggleProdukButton({
  id,
  aktif,
}: {
  id: string;
  aktif: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleProdukAction(id, aktif);
      toast.success(aktif ? "Produk dinonaktifkan." : "Produk diaktifkan.");
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
