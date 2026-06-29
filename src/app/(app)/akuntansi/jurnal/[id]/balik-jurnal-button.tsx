"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { balikJurnalAction } from "../actions";

export function BalikJurnalButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm("Buat jurnal pembalik untuk jurnal ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    startTransition(async () => {
      const result = await balikJurnalAction(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Jurnal pembalik berhasil dibuat.");
        router.refresh();
      }
    });
  }

  return (
    <Button variant="outline" className="text-destructive" disabled={pending} onClick={handleClick}>
      {pending ? "Memproses..." : "Balik Jurnal"}
    </Button>
  );
}
