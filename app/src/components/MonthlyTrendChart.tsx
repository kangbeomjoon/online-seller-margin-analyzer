"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyMetrics } from "@/lib/domain/aggregateMetrics";
import { formatCurrency } from "@/lib/ui/formatters";

interface MonthlyTrendChartProps {
  data: MonthlyMetrics[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <section className="rounded-md border border-[#d8dee8] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1f2933]">월별 매출·순이익</h2>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#edf1f5" vertical={false} />
            <XAxis dataKey="orderMonth" tick={{ fill: "#697586", fontSize: 12 }} />
            <YAxis
              tick={{ fill: "#697586", fontSize: 12 }}
              tickFormatter={(value) => `${Number(value) / 10000}만`}
              width={56}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar
              dataKey="totalSales"
              fill="#3f6f68"
              isAnimationActive={false}
              name="매출"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="netProfit"
              fill="#4b78a8"
              isAnimationActive={false}
              name="순이익"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
