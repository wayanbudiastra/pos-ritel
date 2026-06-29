import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOpname } from "@/services/stok-opname.service";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OpnameItemRow } from "./opname-item-row";
import { OpnameActions } from "./opname-actions";

export default async function StokOpnameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [opname, session] = await Promise.all([getOpname(id), auth()]);
  if (!opname) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  const readOnly = opname.status !== "DRAFT";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{opname.nomorOpname}</h1>
          <p className="text-sm text-muted-foreground">
            Lingkup:{" "}
            {opname.lingkup === "SEMUA" ? "Seluruh Produk" : opname.lingkup} ·
            Dibuat oleh {opname.dibuatOleh.nama}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{opname.status.replace("_", " ")}</Badge>
          <OpnameActions
            id={opname.id}
            status={opname.status}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Stok Sistem</TableHead>
            <TableHead>Stok Fisik</TableHead>
            <TableHead>Selisih</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opname.items.map((item) => (
            <OpnameItemRow
              key={item.id}
              item={{
                id: item.id,
                produkNama: item.produk.nama,
                stokSistem: item.stokSistem,
                stokFisik: item.stokFisik,
                selisih: item.selisih,
                alasanKode: item.alasanKode,
              }}
              readOnly={readOnly}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
