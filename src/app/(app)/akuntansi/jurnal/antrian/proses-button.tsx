"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { prosesJurnalOtomatisAction } from "./actions";

export function ProsesSekarangButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const hasil = await prosesJurnalOtomatisAction();
      if (hasil.gagal.length === 0) {
        toast.success(`${hasil.sukses} event berhasil diproses jadi jurnal.`);
      } else {
        toast.warning(`${hasil.sukses} sukses, ${hasil.gagal.length} gagal diproses. Lihat detail di bawah.`);
      }
      router.refresh();
    });
  }

  return (
    <Button disabled={pending} onClick={handleClick}>
      {pending ? "Memproses..." : "Proses Sekarang"}
    </Button>
  );
}
