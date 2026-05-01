import type {
  CalculatedOrder,
  FeeRule,
  ProductCost,
  StandardOrder,
} from "./types";

export function calculateMargins(
  orders: StandardOrder[],
  productCosts: ProductCost[],
  feeRules: FeeRule[],
): CalculatedOrder[] {
  const productCostMap = new Map(
    productCosts.map((cost) => [buildProductKey(cost), cost]),
  );
  const feeRuleMap = new Map(feeRules.map((rule) => [rule.platform, rule]));

  return orders.map((order) => {
    if (order.orderStatus === "canceled" || order.orderStatus === "returned") {
      return buildUncalculatedOrder(order, "excluded");
    }

    const productCost = productCostMap.get(buildProductKey(order));
    const feeRule = feeRuleMap.get(order.platform);

    if (!productCost) {
      return buildUncalculatedOrder(order, "missing_cost");
    }

    if (!feeRule) {
      throw new Error(`Missing fee rule for platform: ${order.platform}`);
    }

    const salesFee = Math.round(order.grossSales * feeRule.baseFeeRate);
    const paymentFee = Math.round(order.paidAmount * feeRule.paymentFeeRate);
    const fixedFee = feeRule.fixedFeePerOrder;
    const productCostTotal = productCost.unitCost * order.quantity;
    const packagingCostTotal = productCost.packagingCost * order.quantity;
    const otherCostTotal = productCost.otherCost * order.quantity;
    const totalCost =
      productCostTotal +
      productCost.defaultShippingCost +
      packagingCostTotal +
      otherCostTotal +
      salesFee +
      paymentFee +
      fixedFee;
    const netSales = order.grossSales - order.discountAmount;
    const netProfit = netSales - totalCost;
    const marginRate = netSales > 0 ? netProfit / netSales : null;

    return {
      ...order,
      productCode: productCost.productCode,
      unitCost: productCost.unitCost,
      shippingCost: productCost.defaultShippingCost,
      packagingCost: productCost.packagingCost,
      otherCost: productCost.otherCost,
      salesFee,
      paymentFee,
      fixedFee,
      totalCost,
      netProfit,
      marginRate,
      profitStatus: getProfitStatus(netProfit, marginRate),
    };
  });
}

function buildUncalculatedOrder(
  order: StandardOrder,
  profitStatus: "excluded" | "missing_cost",
): CalculatedOrder {
  return {
    ...order,
    productCode: null,
    unitCost: null,
    shippingCost: null,
    packagingCost: null,
    otherCost: null,
    salesFee: 0,
    paymentFee: 0,
    fixedFee: 0,
    totalCost: null,
    netProfit: null,
    marginRate: null,
    profitStatus,
  };
}

function buildProductKey({
  productName,
  optionName,
}: Pick<ProductCost | StandardOrder, "productName" | "optionName">): string {
  return `${productName}::${optionName}`;
}

function getProfitStatus(
  netProfit: number,
  marginRate: number | null,
): CalculatedOrder["profitStatus"] {
  if (netProfit < 0) {
    return "loss";
  }

  if (marginRate !== null && marginRate < 0.2) {
    return "low_margin";
  }

  return "healthy";
}
