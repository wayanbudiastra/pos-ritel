"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  ShoppingCart,
  Users,
  Package,
  Tags,
  Truck,
  Undo2,
  ClipboardList,
  PackageCheck,
  Warehouse,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Store,
  BookText,
  Network,
  ScrollText,
  TrendingUp,
  Scale,
} from "lucide-react";
import { ROUTE_ACCESS } from "@/lib/route-access";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignOutButton } from "./sign-out-button";
import { cn } from "@/lib/utils";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import type { Role } from "@prisma/client";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/pos": ShoppingCart,
  "/member": Users,
  "/master-data/produk": Package,
  "/master-data/kategori": Tags,
  "/master-data/supplier": Truck,
  "/penjualan/retur": Undo2,
  "/pembelian": ClipboardList,
  "/grn": PackageCheck,
  "/inventory": Warehouse,
  "/laporan/stok": Warehouse,
  "/laporan": BarChart3,
  "/akuntansi/jurnal": ScrollText,
  "/akuntansi/pemetaan": Network,
  "/akuntansi/coa": BookText,
  "/akuntansi/laba-rugi": TrendingUp,
  "/akuntansi/neraca": Scale,
};

export function Sidebar({ userName, role }: { userName: string; role: Role }) {
  const pathname = usePathname();
  const navItems = ROUTE_ACCESS.filter((item) => item.roles.includes(role));
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  const initial = userName.charAt(0).toUpperCase() || "?";

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Store className="size-5 shrink-0 text-primary" />
        {!collapsed && (
          <span className="font-heading text-sm font-semibold tracking-tight">
            POS Retail
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = ICONS[item.href] ?? Package;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const linkClassName = cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0",
          );
          const content = (
            <>
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={<Link href={item.href} className={linkClassName} />}
                >
                  {content}
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={linkClassName}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
          {!collapsed && <span>Tutup Sidebar</span>}
        </button>

        <div
          className={cn(
            "mt-1 flex items-center gap-2 rounded-md px-3 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{role}</p>
            </div>
          )}
        </div>
        <div className={cn(collapsed && "flex justify-center")}>
          <SignOutButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
