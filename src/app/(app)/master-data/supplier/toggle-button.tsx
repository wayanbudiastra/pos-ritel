"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleSupplierAction } from "./actions";

export function ToggleSupplierButton({
  id,
  aktif,
}: {
  id: string;
  aktif: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleSupplierAction(id, aktif);
      toast.success(aktif ? "Supplier dinonaktifkan." : "Supplier diaktifkan.");
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
