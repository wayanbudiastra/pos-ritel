import Link from "next/link";
import { auth } from "@/lib/auth";
import { listJurnal } from "@/services/jurnal.service";
import { Button } from "@/components/ui/button";
import { JurnalTable } from "./jurnal-table";

export default async function JurnalPage() {
  const [jurnalList, session] = await Promise.all([listJurnal(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  const data = jurnalList.map((j) => ({
    id: j.id,
    nomorJurnal: j.nomorJurnal,
    tanggal: j.tanggal.toISOString(),
    keterangan: j.keterangan,
    sumber: j.sumber,
    status: j.status,
    totalDebit: j.items.reduce((sum, i) => sum + Number(i.debit), 0),
    dibuatOlehNama: j.dibuatOleh.nama,
    sudahDibalik: j.jurnalPembalik !== null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Jurnal</h1>
          <p className="text-sm text-muted-foreground">
            Riwayat jurnal otomatis (dari transaksi) & jurnal manual.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" render={<Link href="/akuntansi/jurnal/antrian" />}>
              Antrian Jurnal Otomatis
            </Button>
          )}
          {isAdmin && (
            <Button render={<Link href="/akuntansi/jurnal/manual/baru" />}>Buat Jurnal Manual</Button>
          )}
        </div>
      </div>
      <JurnalTable data={data} />
    </div>
  );
}
