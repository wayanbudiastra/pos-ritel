import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Akses Ditolak</h1>
      <p className="text-muted-foreground">
        Peran Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button render={<Link href="/login" />}>Kembali ke Login</Button>
    </div>
  );
}
