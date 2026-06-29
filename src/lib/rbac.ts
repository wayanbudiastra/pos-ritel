import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export class ForbiddenError extends Error {
  constructor() {
    super("Akses ditolak: peran Anda tidak memiliki izin untuk aksi ini.");
  }
}

// Defense-in-depth: dipanggil di awal setiap Server Action / Route Handler
// agar validasi role tidak hanya bergantung pada UI yang disembunyikan/disabled (PRD 3.3).
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!role || !allowed.includes(role)) {
    throw new ForbiddenError();
  }
  return session!;
}
