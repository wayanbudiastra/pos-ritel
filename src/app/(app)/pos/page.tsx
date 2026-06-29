import { auth } from "@/lib/auth";
import { getSesiAktif } from "@/services/sesi-kasir.service";
import { BukaSesiForm } from "./buka-sesi-form";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const session = await auth();
  const userId = session!.user.id;

  const sesi = await getSesiAktif(userId);

  if (!sesi) {
    return <BukaSesiForm />;
  }

  return (
    <PosClient sesiKasirId={sesi.id} kasirNama={session!.user.name ?? ""} />
  );
}
