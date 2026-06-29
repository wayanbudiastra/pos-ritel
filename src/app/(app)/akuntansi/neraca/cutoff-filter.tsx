"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function CutOffFilter({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setTanggal(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("tanggal", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Per tanggal</span>
      <Input
        type="date"
        defaultValue={searchParams.get("tanggal") ?? defaultValue}
        onChange={(e) => setTanggal(e.target.value)}
        className="w-36"
      />
    </div>
  );
}
