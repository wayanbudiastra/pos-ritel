"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleMemberAction } from "./actions";

export function ToggleMemberButton({
  id,
  aktif,
}: {
  id: string;
  aktif: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleMemberAction(id, aktif);
      toast.success(aktif ? "Member dinonaktifkan." : "Member diaktifkan.");
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
