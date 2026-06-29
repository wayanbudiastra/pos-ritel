"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteKategoriAction } from "./actions";

export function DeleteKategoriButton({
  id,
  nama,
}: {
  id: string;
  nama: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Hapus kategori "${nama}"?`)) return;
    startTransition(async () => {
      const result = await deleteKategoriAction(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Kategori dihapus.");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={pending}
      onClick={handleDelete}
    >
      Hapus
    </Button>
  );
}
