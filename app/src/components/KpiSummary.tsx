import { AlertTriangle, Ban, CircleDollarSign, Percent, TrendingUp } from "lucide-react";
import type { DashboardMetrics } from "@/lib/domain/aggregateMetrics";
import { formatCount, formatCurrency, formatPercent } from "@/lib/ui/formatters";

interface KpiSummaryProps {
  metrics: DashboardMetrics;
}

export function KpiSummary({ metrics }: KpiSummaryProps) {
  const items = [
    {
      label: "총매출",
      value: formatCurrency(metrics.summary.totalSales),
      icon: CircleDollarSign,
      tone: "text-[#2f6f68]",
    },
    {
      label: "순이익",
      value: formatCurrency(metrics.summary.netProfit),
      icon: TrendingUp,
      tone: metrics.summary.netProfit >= 0 ? "text-[#2f6f68]" : "text-[#b42318]",
    },
    {
      label: "평균 마진율",
      value: formatPercent(metrics.summary.averageMarginRate),
      icon: Percent,
      tone: "text-[#355f8f]",
    },
    {
      label: "적자 상품 수",
      value: formatCount(metrics.summary.lossProductCount),
      icon: AlertTriangle,
      tone: "text-[#b42318]",
    },
    {
      label: "계산 제외 주문 수",
      value: formatCount(metrics.summary.excludedOrderCount),
      icon: Ban,
      tone: "text-[#8a5b00]",
    },
    {
      label: "원가 미등록 주문 수",
      value: formatCount(metrics.summary.missingCostOrderCount),
      icon: AlertTriangle,
      tone: "text-[#8a5b00]",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            className="rounded-md border border-[#d8dee8] bg-white p-4"
            key={item.label}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#697586]">
                {item.label}
              </div>
              <Icon className={`h-4 w-4 ${item.tone}`} />
            </div>
            <div className="mt-3 text-xl font-bold text-[#1f2933]">
              {item.value}
            </div>
          </div>
        );
      })}
    </section>
  );
}
