import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPO } from "@/services/purchase.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PoStatusActions } from "../po-status-actions";
import { PrintPoButton } from "./print-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function PoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [po, session] = await Promise.all([getPO(id), auth()]);
  if (!po) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  const isGudang = session?.user?.role === "GUDANG";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{po.nomorPO}</h1>
          <p className="text-sm text-muted-foreground">
            Dibuat oleh {po.dibuatOleh.nama} ·{" "}
            {new Date(po.createdAt).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintPoButton />
          <PoStatusActions
            id={po.id}
            status={po.status}
            isAdmin={isAdmin}
            isGudang={isGudang}
          />
        </div>
      </div>

      <div className="print-area space-y-4">
        <p>
          <strong>Supplier:</strong> {po.supplier.nama} ·{" "}
          {po.supplier.telepon ?? "-"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <Badge variant="secondary">{po.status.replace("_", " ")}</Badge>
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Qty Pesan</TableHead>
              <TableHead>Harga Beli</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Qty Diterima</TableHead>
              <TableHead>Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.produk.nama}</TableCell>
                <TableCell>{item.qtyPesan}</TableCell>
                <TableCell>{formatRupiah(Number(item.hargaBeli))}</TableCell>
                <TableCell>
                  {formatRupiah(item.qtyPesan * Number(item.hargaBeli))}
                </TableCell>
                <TableCell>{item.qtyDiterima}</TableCell>
                <TableCell>{item.qtyPesan - item.qtyDiterima}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-right font-semibold">
          Total: {formatRupiah(Number(po.totalNilai))}
        </p>
      </div>

      {po.grn.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Riwayat GRN</h2>
          <ul className="list-inside list-disc text-sm">
            {po.grn.map((g) => (
              <li key={g.id}>
                {g.nomorGRN} — {g.items.length} item
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
