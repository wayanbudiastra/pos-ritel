"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitOpnameAction, approveOpnameAction } from "../actions";

export function OpnameActions({
  id,
  status,
  isAdmin,
}: {
  id: string;
  status: "DRAFT" | "MENUNGGU_APPROVAL" | "SELESAI";
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitOpnameAction(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Stok opname disubmit.");
        router.refresh();
      }
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveOpnameAction(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Stok opname disetujui, stok telah disesuaikan.");
        router.refresh();
      }
    });
  }

  if (status === "DRAFT") {
    return (
      <Button disabled={pending} onClick={handleSubmit}>
        Submit Opname
      </Button>
    );
  }
  if (status === "MENUNGGU_APPROVAL" && isAdmin) {
    return (
      <Button disabled={pending} onClick={handleApprove}>
        Setujui & Terapkan
      </Button>
    );
  }
  return null;
}
