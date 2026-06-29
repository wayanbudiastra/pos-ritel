"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputFisikAction } from "../actions";

const ALASAN_OPTIONS = [
  { value: "HILANG", label: "Hilang" },
  { value: "RUSAK", label: "Rusak" },
  { value: "SALAH_CATAT", label: "Salah Catat" },
  { value: "DITEMUKAN", label: "Ditemukan" },
  { value: "LAINNYA", label: "Lainnya" },
];

type Item = {
  id: string;
  produkNama: string;
  stokSistem: number;
  stokFisik: number | null;
  selisih: number | null;
  alasanKode: string | null;
};

export function OpnameItemRow({
  item,
  readOnly,
}: {
  item: Item;
  readOnly: boolean;
}) {
  const [stokFisik, setStokFisik] = useState(item.stokFisik ?? item.stokSistem);
  const [alasanKode, setAlasanKode] = useState(item.alasanKode ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(item.stokFisik !== null);

  const selisih = stokFisik - item.stokSistem;

  function handleSave() {
    if (selisih !== 0 && !alasanKode) {
      toast.error("Alasan wajib diisi jika ada selisih.");
      return;
    }
    startTransition(async () => {
      const result = await inputFisikAction(
        item.id,
        stokFisik,
        alasanKode || undefined,
      );
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Tersimpan.");
        setSaved(true);
      }
    });
  }

  return (
    <TableRow>
      <TableCell>{item.produkNama}</TableCell>
      <TableCell>{item.stokSistem}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          value={stokFisik}
          disabled={readOnly}
          onChange={(e) => {
            setStokFisik(Number(e.target.value));
            setSaved(false);
          }}
          className="w-24"
        />
      </TableCell>
      <TableCell className={selisih !== 0 ? "text-destructive" : ""}>
        {selisih > 0 ? `+${selisih}` : selisih}
      </TableCell>
      <TableCell>
        {selisih !== 0 && (
          <Select
            value={alasanKode}
            disabled={readOnly}
            onValueChange={(v) => {
              setAlasanKode(v ?? "");
              setSaved(false);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Pilih alasan" />
            </SelectTrigger>
            <SelectContent>
              {ALASAN_OPTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        {!readOnly && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending || saved}
            onClick={handleSave}
          >
            {saved ? "Tersimpan" : "Simpan"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
