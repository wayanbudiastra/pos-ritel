"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { setPemetaanAkunAction } from "./actions";

type AkunOption = { id: string; kode: string; nama: string };

export function PemetaanRow({
  kunci,
  label,
  akunId,
  akunList,
}: {
  kunci: string;
  label: string;
  akunId: string | null;
  akunList: AkunOption[];
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      const result = await setPemetaanAkunAction(kunci, value);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Pemetaan "${label}" diperbarui.`);
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{kunci}</TableCell>
      <TableCell>{label}</TableCell>
      <TableCell>
        <Select
          items={akunList.map((a) => ({ value: a.id, label: `${a.kode} — ${a.nama}` }))}
          value={akunId ?? undefined}
          onValueChange={handleChange}
          disabled={pending}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Pilih akun..." />
          </SelectTrigger>
          <SelectContent>
            {akunList.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.kode} — {a.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
