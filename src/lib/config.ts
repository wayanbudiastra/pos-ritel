// Ambang batas yang disebut PRD sebagai "dikonfigurasi di pengaturan sistem"
// (lihat PRD 10.2 — belum ada modul Konfigurasi Sistem, jadi untuk saat ini
// diatur lewat environment variable dengan nilai default).
export const PO_APPROVAL_THRESHOLD =
  Number(process.env.PO_APPROVAL_THRESHOLD) || 5_000_000;
export const STOK_OPNAME_APPROVAL_THRESHOLD =
  Number(process.env.STOK_OPNAME_APPROVAL_THRESHOLD) || 500_000;
