import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ValidationReport } from "@/lib/domain/validations";
import { formatCurrency, formatPercent, translatePlatform } from "@/lib/ui/formatters";

interface ValidationPanelProps {
  report: ValidationReport;
}

export function ValidationPanel({ report }: ValidationPanelProps) {
  const totalWarnings =
    report.missingCostOrders.length +
    report.suspectedMissingShippingCostOrders.length +
    report.suspectedMissingFeeRulePlatforms.length +
    report.lossProducts.length +
    report.lowMarginProducts.length +
    report.excludedOrders.length;

  return (
    <section className="rounded-md border border-[#d8dee8] bg-white">
      <div className="flex items-center justify-between border-b border-[#e4e9f0] px-4 py-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#1f2933]">
          <AlertTriangle className="h-4 w-4 text-[#b06b18]" />
          경고·검증
        </h2>
        <span className="rounded-md bg-[#fff6df] px-2 py-1 text-xs font-semibold text-[#8a5b00]">
          {totalWarnings}건
        </span>
      </div>
      <div className="grid gap-3 p-4">
        {totalWarnings === 0 ? (
          <div className="flex items-center gap-2 rounded-md bg-[#eaf6ef] px-3 py-2 text-sm font-semibold text-[#287047]">
            <CheckCircle2 className="h-4 w-4" />
            검증 경고 없음
          </div>
        ) : null}
        <WarningGroup
          title="원가 미등록"
          count={report.missingCostOrders.length}
          items={report.missingCostOrders
            .slice(0, 4)
            .map((item) => `${item.orderId} · ${item.productName}`)}
        />
        <WarningGroup
          title="배송비 누락 의심"
          count={report.suspectedMissingShippingCostOrders.length}
          items={report.suspectedMissingShippingCostOrders
            .slice(0, 4)
            .map((item) => `${item.orderId} · ${item.productName}`)}
        />
        <WarningGroup
          title="수수료 누락 의심"
          count={report.suspectedMissingFeeRulePlatforms.length}
          items={report.suspectedMissingFeeRulePlatforms.map(
            (item) => `${translatePlatform(item.platform)} · ${item.orderCount}건`,
          )}
        />
        <WarningGroup
          title="적자 상품 TOP 10"
          count={report.lossProducts.length}
          items={report.lossProducts
            .slice(0, 4)
            .map((item) => `${item.productName} · ${formatCurrency(item.netProfit)}`)}
        />
        <WarningGroup
          title="저마진 상품 TOP 10"
          count={report.lowMarginProducts.length}
          items={report.lowMarginProducts
            .slice(0, 4)
            .map((item) => `${item.productName} · ${formatPercent(item.marginRate)}`)}
        />
        <WarningGroup
          title="계산 제외 주문"
          count={report.excludedOrders.length}
          items={report.excludedOrders
            .slice(0, 4)
            .map((item) => `${item.orderId} · ${item.productName}`)}
        />
      </div>
    </section>
  );
}

function WarningGroup({
  count,
  items,
  title,
}: {
  count: number;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-[#eef2f6] bg-[#fbfcfd] p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1f2933]">{title}</h3>
        <span className="text-xs font-semibold text-[#697586]">{count}</span>
      </div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-[#596579]">
          {items.map((item) => (
            <li className="truncate" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
