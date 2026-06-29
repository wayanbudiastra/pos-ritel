import Link from "next/link";
import { previewAntrian } from "@/services/event-consumer.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProsesSekarangButton } from "./proses-button";

const EVENT_LABEL: Record<string, string> = {
  SALE_COMPLETED: "Penjualan Selesai",
  PURCHASE_RECEIVED: "Penerimaan Barang (GRN)",
  STOCK_ADJUSTED: "Penyesuaian Stok",
  PURCHASE_PAID: "Pembayaran Hutang Supplier",
};

export default async function AntrianJurnalPage() {
  const items = await previewAntrian();
  const jumlahSiap = items.filter((i) => i.status === "SIAP").length;
  const jumlahGagal = items.filter((i) => i.status === "GAGAL").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Antrian Jurnal Otomatis</h1>
          <p className="text-sm text-muted-foreground">
            Event dari transaksi POS/Pembelian/Inventory yang belum dijadikan jurnal.
          </p>
          <Button variant="link" size="sm" className="px-0" render={<Link href="/akuntansi/jurnal" />}>
            ← Kembali ke Riwayat Jurnal
          </Button>
        </div>
        <ProsesSekarangButton />
      </div>

      <p className="text-sm text-muted-foreground">
        {items.length} event menunggu — {jumlahSiap} siap diproses, {jumlahGagal} perlu perhatian.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis Event</TableHead>
            <TableHead>Referensi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-xs">{new Date(item.createdAt).toLocaleString("id-ID")}</TableCell>
              <TableCell>{EVENT_LABEL[item.eventType] ?? item.eventType}</TableCell>
              <TableCell className="font-mono text-xs">{item.referensiId}</TableCell>
              <TableCell>
                {item.status === "SIAP" ? (
                  <Badge variant="success">Siap</Badge>
                ) : (
                  <Badge variant="destructive">Gagal</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">{item.alasan ?? "-"}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Tidak ada event yang menunggu diproses. Semua sudah jadi jurnal.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
