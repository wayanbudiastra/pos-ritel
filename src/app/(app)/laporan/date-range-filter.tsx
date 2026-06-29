"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") ?? "7";

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("range", value);
    if (value !== "custom") {
      params.delete("start");
      params.delete("end");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setCustomDate(key: "start" | "end", value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("range", "custom");
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { value: "7", label: "7 Hari" },
        { value: "30", label: "30 Hari" },
      ].map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={range === opt.value ? "default" : "outline"}
          onClick={() => setRange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
      <Button
        size="sm"
        variant={range === "custom" ? "default" : "outline"}
        onClick={() => setRange("custom")}
        className={cn(range !== "custom" && "text-muted-foreground")}
      >
        Custom
      </Button>
      {range === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            defaultValue={searchParams.get("start") ?? ""}
            onChange={(e) => setCustomDate("start", e.target.value)}
            className="w-36"
          />
          <span className="text-sm text-muted-foreground">s/d</span>
          <Input
            type="date"
            defaultValue={searchParams.get("end") ?? ""}
            onChange={(e) => setCustomDate("end", e.target.value)}
            className="w-36"
          />
        </div>
      )}
    </div>
  );
}
