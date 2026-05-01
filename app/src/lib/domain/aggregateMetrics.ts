import type { CalculatedOrder, Platform, ProfitStatus } from "./types";

export interface DashboardMetrics {
  summary: SummaryMetrics;
  monthly: MonthlyMetrics[];
  platforms: PlatformMetrics[];
  products: ProductMarginMetrics[];
}

export interface SummaryMetrics {
  totalSales: number;
  netProfit: number;
  averageMarginRate: number;
  lossProductCount: number;
  excludedOrderCount: number;
  missingCostOrderCount: number;
}

export interface MonthlyMetrics {
  orderMonth: string;
  totalSales: number;
  netProfit: number;
}

export interface PlatformMetrics {
  platform: Platform;
  totalSales: number;
  netProfit: number;
}

export interface ProductMarginMetrics {
  productCode: string;
  productName: string;
  optionName: string;
  platform: Platform;
  quantity: number;
  totalSales: number;
  totalCost: number;
  salesFee: number;
  paymentFee: number;
  fixedFee: number;
  feeTotal: number;
  shippingCost: number;
  netProfit: number;
  marginRate: number;
  profitStatus: Extract<ProfitStatus, "healthy" | "low_margin" | "loss">;
}

export function buildDashboardMetrics(
  orders: CalculatedOrder[],
): DashboardMetrics {
  const includedOrders = orders.filter(isFinanciallyIncluded);
  const monthly = buildMonthlyMetrics(includedOrders);
  const platforms = buildPlatformMetrics(includedOrders);
  const products = buildProductMetrics(includedOrders);
  const totalSales = sum(includedOrders, getNetSales);
  const netProfit = sum(includedOrders, (order) => order.netProfit ?? 0);

  return {
    summary: {
      totalSales,
      netProfit,
      averageMarginRate: totalSales > 0 ? netProfit / totalSales : 0,
      lossProductCount: products.filter(
        (product) => product.profitStatus === "loss",
      ).length,
      excludedOrderCount: orders.filter(
        (order) => order.profitStatus === "excluded",
      ).length,
      missingCostOrderCount: orders.filter(
        (order) => order.profitStatus === "missing_cost",
      ).length,
    },
    monthly,
    platforms,
    products,
  };
}

function buildMonthlyMetrics(orders: CalculatedOrder[]): MonthlyMetrics[] {
  const metricsByMonth = new Map<string, MonthlyMetrics>();

  for (const order of orders) {
    const metric = metricsByMonth.get(order.orderMonth) ?? {
      orderMonth: order.orderMonth,
      totalSales: 0,
      netProfit: 0,
    };

    metric.totalSales += getNetSales(order);
    metric.netProfit += order.netProfit ?? 0;
    metricsByMonth.set(order.orderMonth, metric);
  }

  return [...metricsByMonth.values()].sort((a, b) =>
    a.orderMonth.localeCompare(b.orderMonth),
  );
}

function buildPlatformMetrics(orders: CalculatedOrder[]): PlatformMetrics[] {
  const metricsByPlatform = new Map<Platform, PlatformMetrics>();

  for (const order of orders) {
    const metric = metricsByPlatform.get(order.platform) ?? {
      platform: order.platform,
      totalSales: 0,
      netProfit: 0,
    };

    metric.totalSales += getNetSales(order);
    metric.netProfit += order.netProfit ?? 0;
    metricsByPlatform.set(order.platform, metric);
  }

  return [...metricsByPlatform.values()];
}

function buildProductMetrics(
  orders: CalculatedOrder[],
): ProductMarginMetrics[] {
  const metricsByProduct = new Map<string, ProductMarginMetrics>();

  for (const order of orders) {
    const productCode = order.productCode;

    if (!productCode) {
      continue;
    }

    const productKey = [
      productCode,
      order.productName,
      order.optionName,
      order.platform,
    ].join("::");
    const metric = metricsByProduct.get(productKey) ?? {
      productCode,
      productName: order.productName,
      optionName: order.optionName,
      platform: order.platform,
      quantity: 0,
      totalSales: 0,
      totalCost: 0,
      salesFee: 0,
      paymentFee: 0,
      fixedFee: 0,
      feeTotal: 0,
      shippingCost: 0,
      netProfit: 0,
      marginRate: 0,
      profitStatus: "healthy",
    };

    metric.quantity += order.quantity;
    metric.totalSales += getNetSales(order);
    metric.totalCost += order.totalCost ?? 0;
    metric.salesFee += order.salesFee;
    metric.paymentFee += order.paymentFee;
    metric.fixedFee += order.fixedFee;
    metric.feeTotal = metric.salesFee + metric.paymentFee + metric.fixedFee;
    metric.shippingCost += order.shippingCost ?? 0;
    metric.netProfit += order.netProfit ?? 0;
    metric.marginRate =
      metric.totalSales > 0 ? metric.netProfit / metric.totalSales : 0;
    metric.profitStatus = getAggregateProfitStatus(
      metric.netProfit,
      metric.marginRate,
    );
    metricsByProduct.set(productKey, metric);
  }

  return [...metricsByProduct.values()];
}

function isFinanciallyIncluded(order: CalculatedOrder): boolean {
  return (
    order.profitStatus !== "excluded" &&
    order.profitStatus !== "missing_cost" &&
    order.totalCost !== null &&
    order.netProfit !== null
  );
}

function getNetSales(order: CalculatedOrder): number {
  return order.grossSales - order.discountAmount;
}

function getAggregateProfitStatus(
  netProfit: number,
  marginRate: number,
): ProductMarginMetrics["profitStatus"] {
  if (netProfit < 0) {
    return "loss";
  }

  if (marginRate < 0.2) {
    return "low_margin";
  }

  return "healthy";
}

function sum<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((total, item) => total + getValue(item), 0);
}
