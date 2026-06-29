"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerForm } from "@/hooks/use-server-form";
import { createJurnalManualAction } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Akun = { id: string; kode: string; nama: string };
type Line = { key: number; akunId: string; debit: number; kredit: number; keterangan: string };

let keySeq = 0;
function emptyLine(): Line {
  keySeq += 1;
  return { key: keySeq, akunId: "", debit: 0, kredit: 0, keterangan: "" };
}

export function JurnalManualForm({ akunList }: { akunList: Akun[] }) {
  const router = useRouter();
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);

  const { state, pending, handleSubmit: submitForm } = useServerForm(createJurnalManualAction, (result) => {
    toast.success("Jurnal manual berhasil disimpan.");
    if (result.jurnalId) {
      router.push(`/akuntansi/jurnal/${result.jurnalId}`);
    } else {
      router.push("/akuntansi/jurnal");
    }
  });

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalKredit = lines.reduce((sum, l) => sum + (l.kredit || 0), 0);
  const selisih = totalDebit - totalKredit;
  const balanced = Math.abs(selisih) < 0.01 && totalDebit > 0;
  const akunTerisi = lines.every((l) => l.akunId && (l.debit > 0 || l.kredit > 0));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!balanced) {
      e.preventDefault();
      toast.error("Total debit harus sama dengan total kredit.");
      return;
    }
    if (!akunTerisi) {
      e.preventDefault();
      toast.error("Setiap baris harus memilih akun dan mengisi debit atau kredit.");
      return;
    }
    submitForm(e);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          tanggal,
          keterangan,
          lines: lines.map((l) => ({
            akunId: l.akunId,
            debit: l.debit,
            kredit: l.kredit,
            keterangan: l.keterangan,
          })),
        })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tanggal">Tanggal</Label>
          <Input id="tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="keterangan">Keterangan</Label>
          <Input
            id="keterangan"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Setor modal awal pemilik"
            required
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Akun</TableHead>
            <TableHead>Keterangan Baris</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Kredit</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.key}>
              <TableCell>
                <Select
                  items={akunList.map((a) => ({ value: a.id, label: `${a.kode} — ${a.nama}` }))}
                  value={line.akunId}
                  onValueChange={(v) => updateLine(line.key, { akunId: v ?? "" })}
                >
                  <SelectTrigger className="w-56">
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
              <TableCell>
                <Input
                  value={line.keterangan}
                  onChange={(e) => updateLine(line.key, { keterangan: e.target.value })}
                  className="w-40"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  value={line.debit || ""}
                  onChange={(e) =>
                    updateLine(line.key, { debit: Number(e.target.value), kredit: 0 })
                  }
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  value={line.kredit || ""}
                  onChange={(e) =>
                    updateLine(line.key, { kredit: Number(e.target.value), debit: 0 })
                  }
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={lines.length <= 2}
                  onClick={() => removeLine(line.key)}
                >
                  Hapus
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button type="button" variant="outline" size="sm" onClick={addLine}>
        + Tambah Baris
      </Button>

      <div className="flex items-center justify-end gap-6 rounded-md border p-4 text-sm">
        <span>
          Total Debit: <strong>{formatRupiah(totalDebit)}</strong>
        </span>
        <span>
          Total Kredit: <strong>{formatRupiah(totalKredit)}</strong>
        </span>
        <span className={balanced ? "text-green-600" : "text-destructive"}>
          {balanced ? "Seimbang" : `Selisih: ${formatRupiah(Math.abs(selisih))}`}
        </span>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending || !balanced || !akunTerisi}>
        {pending ? "Menyimpan..." : "Simpan Jurnal"}
      </Button>
    </form>
  );
}
