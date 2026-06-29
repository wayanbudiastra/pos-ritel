import Link from "next/link";
import { listAkun } from "@/services/akun.service";
import { Button } from "@/components/ui/button";
import { JurnalManualForm } from "./jurnal-manual-form";

export default async function JurnalManualBaruPage() {
  const akunList = await listAkun();
  const akunAktif = akunList
    .filter((a) => a.aktif)
    .map((a) => ({ id: a.id, kode: a.kode, nama: a.nama }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Buat Jurnal Manual</h1>
        <Button variant="link" size="sm" className="px-0" render={<Link href="/akuntansi/jurnal" />}>
          ← Kembali ke Riwayat Jurnal
        </Button>
      </div>
      <JurnalManualForm akunList={akunAktif} />
    </div>
  );
}
