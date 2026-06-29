"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function PeriodeFilter({
  defaultStart,
  defaultEnd,
}: {
  defaultStart: string;
  defaultEnd: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setDate(key: "start" | "end", value: string) {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        defaultValue={searchParams.get("start") ?? defaultStart}
        onChange={(e) => setDate("start", e.target.value)}
        className="w-36"
      />
      <span className="text-sm text-muted-foreground">s/d</span>
      <Input
        type="date"
        defaultValue={searchParams.get("end") ?? defaultEnd}
        onChange={(e) => setDate("end", e.target.value)}
        className="w-36"
      />
    </div>
  );
}
