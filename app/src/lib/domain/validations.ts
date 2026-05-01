import {
  buildDashboardMetrics,
  type ProductMarginMetrics,
} from "./aggregateMetrics";
import type { CalculatedOrder, Platform } from "./types";

export interface ValidationReport {
  missingCostOrders: OrderValidationWarning[];
  suspectedMissingShippingCostOrders: OrderValidationWarning[];
  suspectedMissingFeeRulePlatforms: FeeRuleValidationWarning[];
  lossProducts: ProductValidationWarning[];
  lowMarginProducts: ProductValidationWarning[];
  excludedOrders: OrderValidationWarning[];
}

export interface OrderValidationWarning {
  orderId: string;
  platform: Platform;
  productName: string;
  optionName: string;
  orderStatus: CalculatedOrder["orderStatus"];
}

export interface FeeRuleValidationWarning {
  platform: Platform;
  orderCount: number;
  orderIds: string[];
}

export interface ProductValidationWarning {
  productCode: string;
  productName: string;
  optionName: string;
  platform: Platform;
  quantity: number;
  totalSales: number;
  netProfit: number;
  marginRate: number;
  profitStatus: ProductMarginMetrics["profitStatus"];
}

export function buildValidationReport(
  orders: CalculatedOrder[],
): ValidationReport {
  const products = buildDashboardMetrics(orders).products;

  return {
    missingCostOrders: orders
      .filter((order) => order.profitStatus === "missing_cost")
      .map(toOrderWarning),
    suspectedMissingShippingCostOrders: orders
      .filter(hasSuspectedMissingShippingCost)
      .map(toOrderWarning),
    suspectedMissingFeeRulePlatforms:
      buildSuspectedMissingFeeRulePlatformWarnings(orders),
    lossProducts: products
      .filter((product) => product.profitStatus === "loss")
      .sort((a, b) => a.netProfit - b.netProfit)
      .slice(0, 10)
      .map(toProductWarning),
    lowMarginProducts: products
      .filter((product) => product.profitStatus === "low_margin")
      .sort((a, b) => a.marginRate - b.marginRate)
      .slice(0, 10)
      .map(toProductWarning),
    excludedOrders: orders
      .filter((order) => order.profitStatus === "excluded")
      .map(toOrderWarning),
  };
}

function hasSuspectedMissingShippingCost(order: CalculatedOrder): boolean {
  return (
    order.profitStatus !== "excluded" &&
    order.profitStatus !== "missing_cost" &&
    order.shippingCost !== null &&
    order.shippingCost <= 0
  );
}

function buildSuspectedMissingFeeRulePlatformWarnings(
  orders: CalculatedOrder[],
): FeeRuleValidationWarning[] {
  const orderIdsByPlatform = new Map<Platform, string[]>();

  for (const order of orders) {
    if (!hasSuspectedMissingFeeRule(order)) {
      continue;
    }

    const orderIds = orderIdsByPlatform.get(order.platform) ?? [];
    orderIds.push(order.orderId);
    orderIdsByPlatform.set(order.platform, orderIds);
  }

  return [...orderIdsByPlatform.entries()].map(([platform, orderIds]) => ({
    platform,
    orderCount: orderIds.length,
    orderIds,
  }));
}

function hasSuspectedMissingFeeRule(order: CalculatedOrder): boolean {
  return (
    order.profitStatus !== "excluded" &&
    order.profitStatus !== "missing_cost" &&
    order.grossSales > 0 &&
    order.paidAmount > 0 &&
    order.salesFee === 0 &&
    order.paymentFee === 0 &&
    order.fixedFee === 0
  );
}

function toOrderWarning(order: CalculatedOrder): OrderValidationWarning {
  return {
    orderId: order.orderId,
    platform: order.platform,
    productName: order.productName,
    optionName: order.optionName,
    orderStatus: order.orderStatus,
  };
}

function toProductWarning(
  product: ProductMarginMetrics,
): ProductValidationWarning {
  return {
    productCode: product.productCode,
    productName: product.productName,
    optionName: product.optionName,
    platform: product.platform,
    quantity: product.quantity,
    totalSales: product.totalSales,
    netProfit: product.netProfit,
    marginRate: product.marginRate,
    profitStatus: product.profitStatus,
  };
}
