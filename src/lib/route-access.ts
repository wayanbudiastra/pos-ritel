import type { Role } from "@prisma/client";

// Peta akses per-prefix sesuai PRD 3.2 Matriks Hak Akses per Modul.
// Dipakai middleware (guard) dan Nav (tampilan menu sesuai role).
export const ROUTE_ACCESS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/pos", label: "Kasir (POS)", roles: ["ADMIN", "KASIR"] },
  { href: "/member", label: "Member", roles: ["OWNER", "ADMIN", "KASIR"] },
  {
    href: "/master-data/produk",
    label: "Produk",
    roles: ["OWNER", "ADMIN", "KASIR", "GUDANG"],
  },
  {
    href: "/master-data/kategori",
    label: "Kategori",
    roles: ["OWNER", "ADMIN", "KASIR", "GUDANG"],
  },
  {
    href: "/master-data/supplier",
    label: "Supplier",
    roles: ["OWNER", "ADMIN", "KASIR", "GUDANG"],
  },
  { href: "/penjualan/retur", label: "Retur Penjualan", roles: ["ADMIN"] },
  {
    href: "/pembelian",
    label: "Pembelian (PO)",
    roles: ["OWNER", "ADMIN", "GUDANG"],
  },
  { href: "/grn", label: "GRN", roles: ["OWNER", "ADMIN", "GUDANG"] },
  {
    href: "/inventory",
    label: "Inventory",
    roles: ["OWNER", "ADMIN", "KASIR", "GUDANG"],
  },
  {
    href: "/laporan/stok",
    label: "Laporan Stok",
    roles: ["OWNER", "ADMIN", "GUDANG"],
  },
  { href: "/laporan", label: "Dashboard & Laporan", roles: ["OWNER", "ADMIN"] },
];

export function findRouteAccess(pathname: string) {
  return ROUTE_ACCESS.find((r) => pathname.startsWith(r.href));
}
