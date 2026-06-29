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
import { useServerForm } from "@/hooks/use-server-form";
import { createGrnAction } from "../../actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type PoItem = {
  id: string;
  produkId: string;
  produkNama: string;
  qtyPesan: number;
  qtyDiterima: number;
  hargaBeli: number;
};

type Row = {
  poItemId: string;
  produkId: string;
  produkNama: string;
  outstanding: number;
  hargaBeliPo: number;
  qtyDiterima: number;
  qtyDitolak: number;
  hargaAktual: number;
  nomorBatch: string;
  tanggalExpired: string;
  terimaKelebihan: boolean;
};

export function GrnForm({
  poId,
  poItems,
}: {
  poId: string;
  poItems: PoItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    poItems
      .filter((i) => i.qtyPesan - i.qtyDiterima > 0)
      .map((i) => ({
        poItemId: i.id,
        produkId: i.produkId,
        produkNama: i.produkNama,
        outstanding: i.qtyPesan - i.qtyDiterima,
        hargaBeliPo: i.hargaBeli,
        qtyDiterima: i.qtyPesan - i.qtyDiterima,
        qtyDitolak: 0,
        hargaAktual: i.hargaBeli,
        nomorBatch: "",
        tanggalExpired: "",
        terimaKelebihan: false,
      })),
  );
  const [catatan, setCatatan] = useState("");

  const {
    state,
    pending,
    handleSubmit: submitForm,
  } = useServerForm(createGrnAction, () => {
    toast.success("GRN berhasil disimpan, stok telah ditambahkan.");
    router.push("/grn");
  });

  function updateRow(poItemId: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.poItemId === poItemId ? { ...r, ...patch } : r)),
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    submitForm(e);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          poId,
          catatan,
          items: rows.map((r) => ({
            poItemId: r.poItemId,
            produkId: r.produkId,
            qtyDiterima: r.qtyDiterima,
            qtyDitolak: r.qtyDitolak,
            hargaAktual: r.hargaAktual,
            nomorBatch: r.nomorBatch,
            tanggalExpired: r.tanggalExpired,
            terimaKelebihan: r.terimaKelebihan,
          })),
        })}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead>Qty Diterima</TableHead>
            <TableHead>Qty Ditolak</TableHead>
            <TableHead>Harga Aktual</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Expired</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const totalDiproses = row.qtyDiterima + row.qtyDitolak;
            const lebihDariOutstanding = totalDiproses > row.outstanding;
            const diskrepansiHarga = row.hargaAktual !== row.hargaBeliPo;
            return (
              <TableRow key={row.poItemId}>
                <TableCell>
                  {row.produkNama}
                  {diskrepansiHarga && (
                    <p className="text-xs text-yellow-600">
                      Harga PO: {formatRupiah(row.hargaBeliPo)}
                    </p>
                  )}
                </TableCell>
                <TableCell>{row.outstanding}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={row.qtyDiterima}
                    onChange={(e) =>
                      updateRow(row.poItemId, {
                        qtyDiterima: Number(e.target.value),
                      })
                    }
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={row.qtyDitolak}
                    onChange={(e) =>
                      updateRow(row.poItemId, {
                        qtyDitolak: Number(e.target.value),
                      })
                    }
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={row.hargaAktual}
                    onChange={(e) =>
                      updateRow(row.poItemId, {
                        hargaAktual: Number(e.target.value),
                      })
                    }
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.nomorBatch}
                    onChange={(e) =>
                      updateRow(row.poItemId, { nomorBatch: e.target.value })
                    }
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.tanggalExpired}
                    onChange={(e) =>
                      updateRow(row.poItemId, {
                        tanggalExpired: e.target.value,
                      })
                    }
                  />
                </TableCell>
                {lebihDariOutstanding && (
                  <TableCell>
                    <label className="flex items-center gap-1 text-xs text-destructive">
                      <input
                        type="checkbox"
                        checked={row.terimaKelebihan}
                        onChange={(e) =>
                          updateRow(row.poItemId, {
                            terimaKelebihan: e.target.checked,
                          })
                        }
                      />
                      Terima kelebihan
                    </label>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan</Label>
        <Input
          id="catatan"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan GRN"}
      </Button>
    </form>
  );
}
