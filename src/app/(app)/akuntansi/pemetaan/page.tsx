import { listPemetaanAkun } from "@/services/pemetaan-akun.service";
import { listAkun } from "@/services/akun.service";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PemetaanRow } from "./pemetaan-row";

export default async function PemetaanAkunPage() {
  const [pemetaanList, akunList] = await Promise.all([listPemetaanAkun(), listAkun()]);
  const akunAktif = akunList.filter((a) => a.aktif).map((a) => ({ id: a.id, kode: a.kode, nama: a.nama }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Pemetaan Akun</h1>
        <p className="text-sm text-muted-foreground">
          Hubungkan setiap jenis transaksi ke akun COA agar Jurnal Otomatis tidak hardcode kode akun.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kunci</TableHead>
            <TableHead>Dipakai Untuk</TableHead>
            <TableHead>Akun Tujuan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pemetaanList.map((p) => (
            <PemetaanRow
              key={p.kunci}
              kunci={p.kunci}
              label={p.label}
              akunId={p.akunId}
              akunList={akunAktif}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
