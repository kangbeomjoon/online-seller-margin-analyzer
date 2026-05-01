import { describe, expect, it } from "vitest";
import { calculateMargins } from "../lib/domain/calculateMargins";
import type { FeeRule, ProductCost, StandardOrder } from "../lib/domain/types";

const productCosts: ProductCost[] = [
  {
    productCode: "P-001",
    productName: "프리미엄 무선 충전기",
    optionName: "화이트",
    unitCost: 9200,
    defaultShippingCost: 3000,
    packagingCost: 500,
    otherCost: 300,
  },
  {
    productCode: "P-002",
    productName: "저마진 테스트 상품",
    optionName: "기본",
    unitCost: 13000,
    defaultShippingCost: 3000,
    packagingCost: 500,
    otherCost: 300,
  },
  {
    productCode: "P-003",
    productName: "적자 테스트 상품",
    optionName: "기본",
    unitCost: 17000,
    defaultShippingCost: 3000,
    packagingCost: 500,
    otherCost: 300,
  },
];

const feeRules: FeeRule[] = [
  {
    platform: "smartstore",
    baseFeeRate: 0.035,
    paymentFeeRate: 0.018,
    fixedFeePerOrder: 0,
  },
  {
    platform: "coupang",
    baseFeeRate: 0.085,
    paymentFeeRate: 0.022,
    fixedFeePerOrder: 150,
  },
];

describe("calculateMargins", () => {
  it("calculates profit and margin for a healthy smartstore order", () => {
    const [order] = calculateMargins(
      [
        buildOrder({
          platform: "smartstore",
          grossSales: 39800,
          discountAmount: 2000,
          paidAmount: 40800,
          shippingFeeCharged: 3000,
          quantity: 2,
        }),
      ],
      productCosts,
      feeRules,
    );

    expect(order).toMatchObject({
      productCode: "P-001",
      unitCost: 9200,
      shippingCost: 3000,
      packagingCost: 500,
      otherCost: 300,
      salesFee: 1393,
      paymentFee: 734,
      fixedFee: 0,
      totalCost: 25127,
      netProfit: 12673,
      profitStatus: "healthy",
    });
    expect(order?.marginRate).toBeCloseTo(0.33526455, 6);
  });

  it("applies higher coupang fees than smartstore fees for the same sale", () => {
    const [smartstoreOrder, coupangOrder] = calculateMargins(
      [
        buildOrder({
          platform: "smartstore",
          paidAmount: 19900,
          shippingFeeCharged: 0,
        }),
        buildOrder({
          platform: "coupang",
          paidAmount: 19900,
          shippingFeeCharged: 0,
        }),
      ],
      productCosts,
      feeRules,
    );

    expect(coupangOrder?.salesFee).toBeGreaterThan(
      smartstoreOrder?.salesFee ?? 0,
    );
    expect(coupangOrder?.paymentFee).toBeGreaterThan(
      smartstoreOrder?.paymentFee ?? 0,
    );
    expect(coupangOrder?.fixedFee).toBe(150);
    expect(coupangOrder?.netProfit ?? 0).toBeLessThan(
      smartstoreOrder?.netProfit ?? 0,
    );
  });

  it("marks canceled or returned orders as excluded without calculating totals", () => {
    const [order] = calculateMargins(
      [buildOrder({ orderStatus: "canceled" })],
      productCosts,
      feeRules,
    );

    expect(order).toMatchObject({
      profitStatus: "excluded",
      salesFee: 0,
      paymentFee: 0,
      fixedFee: 0,
      totalCost: null,
      netProfit: null,
      marginRate: null,
    });
  });

  it("marks orders without a matching product cost as missing_cost", () => {
    const [order] = calculateMargins(
      [
        buildOrder({
          productName: "원가표에 없는 상품",
          optionName: "기본",
        }),
      ],
      productCosts,
      feeRules,
    );

    expect(order).toMatchObject({
      productCode: null,
      unitCost: null,
      shippingCost: null,
      packagingCost: null,
      otherCost: null,
      profitStatus: "missing_cost",
      totalCost: null,
      netProfit: null,
      marginRate: null,
    });
  });

  it("marks orders with negative net profit as loss", () => {
    const [order] = calculateMargins(
      [
        buildOrder({
          productName: "적자 테스트 상품",
          optionName: "기본",
          grossSales: 18900,
          discountAmount: 1000,
          paidAmount: 20900,
          quantity: 1,
        }),
      ],
      productCosts,
      feeRules,
    );

    expect(order?.netProfit).toBeLessThan(0);
    expect(order?.profitStatus).toBe("loss");
  });

  it("marks non-negative margins below 20 percent as low_margin", () => {
    const [order] = calculateMargins(
      [
        buildOrder({
          productName: "저마진 테스트 상품",
          optionName: "기본",
          grossSales: 19900,
          discountAmount: 0,
          paidAmount: 22900,
          quantity: 1,
        }),
      ],
      productCosts,
      feeRules,
    );

    expect(order?.netProfit).toBeGreaterThanOrEqual(0);
    expect(order?.marginRate ?? 1).toBeLessThan(0.2);
    expect(order?.profitStatus).toBe("low_margin");
  });
});

function buildOrder(overrides: Partial<StandardOrder> = {}): StandardOrder {
  return {
    platform: "smartstore",
    orderDate: "2026-01-03",
    orderMonth: "2026-01",
    orderId: "ORDER-001",
    productName: "프리미엄 무선 충전기",
    optionName: "화이트",
    quantity: 1,
    grossSales: 19900,
    discountAmount: 0,
    paidAmount: 22900,
    settlementAmount: null,
    shippingFeeCharged: 3000,
    orderStatus: "completed",
    ...overrides,
  };
}
