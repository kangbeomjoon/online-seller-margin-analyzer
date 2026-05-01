"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Table2 } from "lucide-react";
import type { ProductMarginMetrics } from "@/lib/domain/aggregateMetrics";
import {
  formatCurrency,
  formatPercent,
  translatePlatform,
  translateProfitStatus,
} from "@/lib/ui/formatters";

interface ProductMarginTableProps {
  products: ProductMarginMetrics[];
}

type SortKey = "netProfit" | "marginRate" | "quantity";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "netProfit", label: "순이익" },
  { key: "marginRate", label: "마진율" },
  { key: "quantity", label: "판매수량" },
];

export function ProductMarginTable({ products }: ProductMarginTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("netProfit");
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b[sortKey] - a[sortKey]),
    [products, sortKey],
  );

  return (
    <section className="overflow-hidden rounded-md border border-[#d8dee8] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e4e9f0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#1f2933]">
          <Table2 className="h-4 w-4 text-[#3f6f68]" />
          상품별 마진 분석
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              className={`inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-semibold ${
                sortKey === option.key
                  ? "border-[#2f6f68] bg-[#eaf2f0] text-[#255b56]"
                  : "border-[#cfd7e2] bg-white text-[#4b5563]"
              }`}
              key={option.key}
              type="button"
              onClick={() => setSortKey(option.key)}
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse text-sm">
          <thead className="bg-[#f4f7fa] text-left text-xs font-semibold uppercase text-[#596579]">
            <tr>
              <Th>상품명</Th>
              <Th>옵션명</Th>
              <Th>플랫폼</Th>
              <Th align="right">판매수량</Th>
              <Th align="right">매출</Th>
              <Th align="right">원가</Th>
              <Th align="right">수수료</Th>
              <Th align="right">배송비</Th>
              <Th align="right">순이익</Th>
              <Th align="right">마진율</Th>
              <Th>상태</Th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
              <tr
                className="border-t border-[#eef2f6] text-[#1f2933]"
                key={`${product.platform}-${product.productCode}-${product.optionName}`}
              >
                <Td>{product.productName}</Td>
                <Td>{product.optionName}</Td>
                <Td>{translatePlatform(product.platform)}</Td>
                <Td align="right">{product.quantity}</Td>
                <Td align="right">{formatCurrency(product.totalSales)}</Td>
                <Td align="right">{formatCurrency(product.totalCost)}</Td>
                <Td align="right">{formatCurrency(product.feeTotal)}</Td>
                <Td align="right">{formatCurrency(product.shippingCost)}</Td>
                <Td align="right">{formatCurrency(product.netProfit)}</Td>
                <Td align="right">{formatPercent(product.marginRate)}</Td>
                <Td>
                  <span className={statusClassName(product.profitStatus)}>
                    {translateProfitStatus(product.profitStatus)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({
  align = "left",
  children,
}: {
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`}>
      {children}
    </th>
  );
}

function Td({
  align = "left",
  children,
}: {
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <td className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

function statusClassName(status: ProductMarginMetrics["profitStatus"]): string {
  switch (status) {
    case "loss":
      return "rounded-md bg-[#fff1f0] px-2 py-1 text-xs font-semibold text-[#b42318]";
    case "low_margin":
      return "rounded-md bg-[#fff6df] px-2 py-1 text-xs font-semibold text-[#8a5b00]";
    default:
      return "rounded-md bg-[#eaf6ef] px-2 py-1 text-xs font-semibold text-[#287047]";
  }
}
