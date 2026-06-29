"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  submitPoAction,
  approvePoAction,
  batalkanPoAction,
  tutupPoAction,
} from "./actions";

type Status =
  | "DRAFT"
  | "DIAJUKAN"
  | "DISETUJUI"
  | "SEBAGIAN_DITERIMA"
  | "SELESAI"
  | "DIBATALKAN";

export function PoStatusActions({
  id,
  status,
  isAdmin,
  isGudang,
}: {
  id: string;
  status: Status;
  isAdmin: boolean;
  isGudang: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(
    action: (id: string) => Promise<{ error?: string } | undefined>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const result = await action(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(successMsg);
      }
    });
  }

  return (
    <div className="flex justify-end gap-2">
      {status === "DRAFT" && (isAdmin || isGudang) && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(submitPoAction, "PO diajukan/disetujui.")}
        >
          Ajukan
        </Button>
      )}
      {status === "DIAJUKAN" && isAdmin && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(approvePoAction, "PO disetujui.")}
        >
          Setujui
        </Button>
      )}
      {(status === "DRAFT" ||
        status === "DIAJUKAN" ||
        status === "DISETUJUI") &&
        isAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            disabled={pending}
            onClick={() => run(batalkanPoAction, "PO dibatalkan.")}
          >
            Batalkan
          </Button>
        )}
      {status === "SEBAGIAN_DITERIMA" && isAdmin && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(tutupPoAction, "PO ditutup.")}
        >
          Tutup PO
        </Button>
      )}
    </div>
  );
}
