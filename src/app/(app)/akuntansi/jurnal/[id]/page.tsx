import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getJurnalEntry } from "@/services/jurnal.service";
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
import { BalikJurnalButton } from "./balik-jurnal-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function JurnalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jurnal, session] = await Promise.all([getJurnalEntry(id), auth()]);
  if (!jurnal) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  const totalDebit = jurnal.items.reduce((sum, i) => sum + Number(i.debit), 0);
  const totalKredit = jurnal.items.reduce((sum, i) => sum + Number(i.kredit), 0);
  const sudahDibalik = jurnal.jurnalPembalik !== null;
  const bisaDibalik = isAdmin && jurnal.status === "POSTED" && !sudahDibalik;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{jurnal.nomorJurnal}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(jurnal.tanggal).toLocaleDateString("id-ID")} · Dibuat oleh {jurnal.dibuatOleh.nama} ·{" "}
            <Badge variant="secondary">{jurnal.sumber === "OTOMATIS" ? "Otomatis" : "Manual"}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="link" size="sm" render={<Link href="/akuntansi/jurnal" />}>
            ← Kembali ke Riwayat Jurnal
          </Button>
          {bisaDibalik && <BalikJurnalButton id={jurnal.id} />}
        </div>
      </div>

      {jurnal.jurnalPembalikDari && (
        <p className="text-sm text-muted-foreground">
          Ini adalah jurnal pembalik dari{" "}
          <Link className="underline" href={`/akuntansi/jurnal/${jurnal.jurnalPembalikDari.id}`}>
            {jurnal.jurnalPembalikDari.nomorJurnal}
          </Link>
          .
        </p>
      )}
      {sudahDibalik && jurnal.jurnalPembalik && (
        <p className="text-sm text-muted-foreground">
          Jurnal ini sudah dibalik oleh{" "}
          <Link className="underline" href={`/akuntansi/jurnal/${jurnal.jurnalPembalik.id}`}>
            {jurnal.jurnalPembalik.nomorJurnal}
          </Link>
          .
        </p>
      )}

      <p>
        <strong>Keterangan:</strong> {jurnal.keterangan}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Akun</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Kredit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jurnal.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.akun.kode} — {item.akun.nama}
              </TableCell>
              <TableCell>{item.keterangan ?? "-"}</TableCell>
              <TableCell>{Number(item.debit) > 0 ? formatRupiah(Number(item.debit)) : "-"}</TableCell>
              <TableCell>{Number(item.kredit) > 0 ? formatRupiah(Number(item.kredit)) : "-"}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell>{formatRupiah(totalDebit)}</TableCell>
            <TableCell>{formatRupiah(totalKredit)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
