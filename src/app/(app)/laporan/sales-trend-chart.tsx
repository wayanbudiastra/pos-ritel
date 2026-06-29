"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type Point = { tanggal: string; Ritel: number; Grosir: number; Khusus: number };

function formatRupiahShort(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

export function SalesTrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="tanggal" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={formatRupiahShort}
            tick={{ fontSize: 12 }}
            width={50}
          />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(value))
            }
          />
          <Legend />
          <Bar dataKey="Ritel" stackId="a" fill="var(--chart-1)" />
          <Bar dataKey="Grosir" stackId="a" fill="var(--chart-2)" />
          <Bar dataKey="Khusus" stackId="a" fill="var(--chart-3)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
