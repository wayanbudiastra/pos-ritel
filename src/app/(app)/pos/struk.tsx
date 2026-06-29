"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export type StrukData = {
  nomorTransaksi: string;
  createdAt: string;
  kasirNama: string;
  memberNama?: string | null;
  items: { nama: string; qty: number; hargaSatuan: number; subtotal: number }[];
  subtotal: number;
  diskonTotal: number;
  total: number;
  metodePembayaran: string;
  jumlahDibayar: number;
  kembalian: number;
};

export function StrukDialog({
  data,
  onClose,
}: {
  data: StrukData;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Struk Transaksi</DialogTitle>
        </DialogHeader>
        <div id="struk-print" className="space-y-2 font-mono text-xs">
          <p className="text-center font-semibold">POS RETAIL</p>
          <p className="text-center">{data.nomorTransaksi}</p>
          <p className="text-center">
            {new Date(data.createdAt).toLocaleString("id-ID")}
          </p>
          <p>Kasir: {data.kasirNama}</p>
          {data.memberNama && <p>Member: {data.memberNama}</p>}
          <hr />
          {data.items.map((item, idx) => (
            <div key={idx}>
              <p>{item.nama}</p>
              <div className="flex justify-between">
                <span>
                  {item.qty} x {formatRupiah(item.hargaSatuan)}
                </span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
          <hr />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(data.subtotal)}</span>
          </div>
          {data.diskonTotal > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{formatRupiah(data.diskonTotal)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatRupiah(data.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>{data.metodePembayaran}</span>
            <span>{formatRupiah(data.jumlahDibayar)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembalian</span>
            <span>{formatRupiah(data.kembalian)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => window.print()}>Cetak Struk</Button>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
