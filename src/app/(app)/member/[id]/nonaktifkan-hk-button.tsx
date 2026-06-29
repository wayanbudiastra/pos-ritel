"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { nonaktifkanHargaKhususAction } from "./actions";

export function NonaktifkanHkButton({
  id,
  memberId,
}: {
  id: string;
  memberId: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await nonaktifkanHargaKhususAction(id, memberId);
      toast.success("Harga khusus dinonaktifkan.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={pending}
      onClick={handleClick}
    >
      Nonaktifkan
    </Button>
  );
}
