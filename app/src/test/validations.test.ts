import { describe, expect, it } from "vitest";
import { buildValidationReport } from "../lib/domain/validations";
import type { CalculatedOrder } from "../lib/domain/types";

describe("buildValidationReport", () => {
  it("reports missing cost, missing shipping cost, suspected missing fee rules, and excluded orders", () => {
    const report = buildValidationReport([
      buildOrder({
        orderId: "ORDER-MISSING-COST",
        productCode: null,
        productName: "원가 미등록 상품",
        optionName: "기본",
        unitCost: null,
        shippingCost: null,
        packagingCost: null,
        otherCost: null,
        totalCost: null,
        netProfit: null,
        marginRate: null,
        profitStatus: "missing_cost",
      }),
      buildOrder({
        orderId: "ORDER-MISSING-SHIPPING",
        productCode: "P-SHIP",
        productName: "배송비 누락 상품",
        shippingFeeCharged: 3000,
        shippingCost: 0,
      }),
      buildOrder({
        orderId: "ORDER-MISSING-FEE",
        productCode: "P-FEE",
        productName: "수수료 누락 상품",
        grossSales: 20000,
        paidAmount: 23000,
        salesFee: 0,
        paymentFee: 0,
        fixedFee: 0,
      }),
      buildOrder({
        orderId: "ORDER-EXCLUDED",
        orderStatus: "returned",
        totalCost: null,
        netProfit: null,
        marginRate: null,
        profitStatus: "excluded",
      }),
    ]);

    expect(report.missingCostOrders).toEqual([
      {
        orderId: "ORDER-MISSING-COST",
        platform: "smartstore",
        productName: "원가 미등록 상품",
        optionName: "기본",
        orderStatus: "completed",
      },
    ]);
    expect(report.suspectedMissingShippingCostOrders).toEqual([
      {
        orderId: "ORDER-MISSING-SHIPPING",
        platform: "smartstore",
        productName: "배송비 누락 상품",
        optionName: "화이트",
        orderStatus: "completed",
      },
    ]);
    expect(report.suspectedMissingFeeRulePlatforms).toEqual([
      {
        platform: "smartstore",
        orderCount: 1,
        orderIds: ["ORDER-MISSING-FEE"],
      },
    ]);
    expect(report.excludedOrders).toEqual([
      {
        orderId: "ORDER-EXCLUDED",
        platform: "smartstore",
        productName: "프리미엄 무선 충전기",
        optionName: "화이트",
        orderStatus: "returned",
      },
    ]);
  });

  it("reports missing shipping cost even when the seller offered free shipping", () => {
    const report = buildValidationReport([
      buildOrder({
        orderId: "ORDER-FREE-SHIPPING-MISSING-COST",
        shippingFeeCharged: 0,
        shippingCost: 0,
      }),
    ]);

    expect(report.suspectedMissingShippingCostOrders).toEqual([
      {
        orderId: "ORDER-FREE-SHIPPING-MISSING-COST",
        platform: "smartstore",
        productName: "프리미엄 무선 충전기",
        optionName: "화이트",
        orderStatus: "completed",
      },
    ]);
  });

  it("reports the worst loss products and low margin products up to ten items", () => {
    const report = buildValidationReport([
      ...Array.from({ length: 12 }, (_, index) =>
        buildOrder({
          orderId: `ORDER-LOSS-${index + 1}`,
          productCode: `P-LOSS-${index + 1}`,
          productName: `적자 상품 ${index + 1}`,
          grossSales: 10000,
          totalCost: 11000 + index,
          netProfit: -(1000 + index),
          marginRate: -(1000 + index) / 10000,
          profitStatus: "loss",
        }),
      ),
      buildOrder({
        orderId: "ORDER-LOW-1",
        productCode: "P-LOW-1",
        productName: "저마진 상품 1",
        grossSales: 10000,
        totalCost: 9000,
        netProfit: 1000,
        marginRate: 0.1,
        profitStatus: "low_margin",
      }),
      buildOrder({
        orderId: "ORDER-LOW-2",
        productCode: "P-LOW-2",
        productName: "저마진 상품 2",
        grossSales: 10000,
        totalCost: 8500,
        netProfit: 1500,
        marginRate: 0.15,
        profitStatus: "low_margin",
      }),
    ]);

    expect(report.lossProducts).toHaveLength(10);
    expect(report.lossProducts[0]).toMatchObject({
      productCode: "P-LOSS-12",
      productName: "적자 상품 12",
      netProfit: -1011,
      profitStatus: "loss",
    });
    expect(report.lossProducts.at(-1)).toMatchObject({
      productCode: "P-LOSS-3",
      productName: "적자 상품 3",
      netProfit: -1002,
      profitStatus: "loss",
    });
    expect(report.lowMarginProducts).toEqual([
      expect.objectContaining({
        productCode: "P-LOW-1",
        productName: "저마진 상품 1",
        marginRate: 0.1,
        profitStatus: "low_margin",
      }),
      expect.objectContaining({
        productCode: "P-LOW-2",
        productName: "저마진 상품 2",
        marginRate: 0.15,
        profitStatus: "low_margin",
      }),
    ]);
  });
});

function buildOrder(overrides: Partial<CalculatedOrder> = {}): CalculatedOrder {
  return {
    platform: "smartstore",
    orderDate: "2026-01-03",
    orderMonth: "2026-01",
    orderId: "ORDER-001",
    productCode: "P-001",
    productName: "프리미엄 무선 충전기",
    optionName: "화이트",
    quantity: 1,
    grossSales: 10000,
    discountAmount: 0,
    paidAmount: 13000,
    settlementAmount: null,
    shippingFeeCharged: 3000,
    orderStatus: "completed",
    unitCost: 3000,
    shippingCost: 3000,
    packagingCost: 500,
    otherCost: 300,
    salesFee: 350,
    paymentFee: 234,
    fixedFee: 0,
    totalCost: 7384,
    netProfit: 2616,
    marginRate: 0.2616,
    profitStatus: "healthy",
    ...overrides,
  };
}
