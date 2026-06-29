import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMember, getRiwayatMember } from "@/services/member.service";
import {
  listHargaKhususByMember,
  listHargaKhususLog,
} from "@/services/harga-khusus.service";
import { listProduk } from "@/services/produk.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HargaKhususDialog } from "./harga-khusus-dialog";
import { HargaKhususTable } from "./harga-khusus-table";
import { HargaKhususLogTable } from "./harga-khusus-log-table";
import { RiwayatTransaksiTable } from "./riwayat-transaksi-table";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  const [hargaKhususList, hargaKhususLog, riwayat, produkList, session] =
    await Promise.all([
      listHargaKhususByMember(id),
      listHargaKhususLog(id),
      getRiwayatMember(id),
      listProduk(),
      auth(),
    ]);
  const isAdmin = session?.user?.role === "ADMIN";

  const hargaKhususData = hargaKhususList.map((h) => ({
    id: h.id,
    produkNama: h.produk.nama,
    hargaKhusus: Number(h.hargaKhusus),
    tanggalMulai: h.tanggalMulai ? h.tanggalMulai.toISOString() : null,
    tanggalBerakhir: h.tanggalBerakhir ? h.tanggalBerakhir.toISOString() : null,
    status: h.status,
  }));

  const hargaKhususLogData = hargaKhususLog.map((l) => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    hargaLama: l.hargaLama ? Number(l.hargaLama) : null,
    hargaBaru: Number(l.hargaBaru),
    diubahOlehNama: l.diubahOleh.nama,
  }));

  const riwayatData = riwayat.transaksi.map((t) => ({
    id: t.id,
    nomorTransaksi: t.nomorTransaksi,
    createdAt: t.createdAt.toISOString(),
    jumlahItem: t.items.length,
    total: Number(t.total),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{member.nama}</h1>
        <p className="text-sm text-muted-foreground">
          {member.kodeMember} · {member.noHp}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Belanja
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatRupiah(riwayat.totalBelanja)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Frekuensi Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {riwayat.frekuensi}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Rata-rata Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatRupiah(riwayat.rataRata)}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Harga Khusus</h2>
          {isAdmin && (
            <HargaKhususDialog
              memberId={id}
              produkList={produkList.map((p) => ({
                id: p.id,
                nama: p.nama,
                hargaRitel: p.hargaRitel.toString(),
                hargaGrosir: p.hargaGrosir.toString(),
                hpp: p.hpp.toString(),
              }))}
            />
          )}
        </div>
        <HargaKhususTable
          data={hargaKhususData}
          memberId={id}
          isAdmin={isAdmin}
        />
      </div>

      {isAdmin && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">
            Histori Perubahan Harga Khusus
          </h2>
          <HargaKhususLogTable data={hargaKhususLogData} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Riwayat Transaksi</h2>
        <RiwayatTransaksiTable data={riwayatData} />
      </div>
    </div>
  );
}
