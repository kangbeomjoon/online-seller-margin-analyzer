import { describe, expect, it } from "vitest";
import {
  FULL_REPORT_FILENAME,
  MONTHLY_SUMMARY_FILENAME,
  PRODUCT_MARGIN_FILENAME,
  createFullReportWorkbook,
  createMonthlySummaryWorkbook,
  createProductMarginWorkbook,
} from "../lib/domain/exportWorkbook";
import type { SampleReport } from "../lib/sample-data/buildSampleReport";

describe("exportWorkbook", () => {
  it("creates the full report workbook with expected sheets", () => {
    const workbook = createFullReportWorkbook(buildReport());

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "표준 주문 데이터",
      "상품별 마진 분석",
      "월별 요약",
      "플랫폼별 요약",
      "검증 경고",
    ]);
    expect(workbook.getWorksheet("상품별 마진 분석")?.rowCount).toBeGreaterThan(
      1,
    );
    expect(workbook.getWorksheet("검증 경고")?.getCell("A2").value).toBe(
      "수수료 누락 의심",
    );
  });

  it("creates focused workbook variants and exposes fixed portfolio filenames", () => {
    const report = buildReport();

    expect(createProductMarginWorkbook(report).worksheets[0]?.name).toBe(
      "상품별 마진 분석",
    );
    expect(createMonthlySummaryWorkbook(report).worksheets[0]?.name).toBe(
      "월별 요약",
    );
    expect(FULL_REPORT_FILENAME).toBe("seller-margin-report-2026-sample.xlsx");
    expect(PRODUCT_MARGIN_FILENAME).toBe(
      "product-margin-analysis-2026-sample.xlsx",
    );
    expect(MONTHLY_SUMMARY_FILENAME).toBe(
      "monthly-profit-summary-2026-sample.xlsx",
    );
  });
});

function buildReport(): SampleReport {
  return {
    standardOrders: [
      {
        platform: "smartstore",
        orderDate: "2026-01-03",
        orderMonth: "2026-01",
        orderId: "ORDER-001",
        productName: "프리미엄 무선 충전기",
        optionName: "화이트",
        quantity: 1,
        grossSales: 10000,
        discountAmount: 0,
        paidAmount: 13000,
        settlementAmount: null,
        shippingFeeCharged: 3000,
        orderStatus: "completed",
      },
    ],
    calculatedOrders: [],
    metrics: {
      summary: {
        totalSales: 10000,
        netProfit: 3000,
        averageMarginRate: 0.3,
        lossProductCount: 0,
        excludedOrderCount: 0,
        missingCostOrderCount: 0,
      },
      monthly: [{ orderMonth: "2026-01", totalSales: 10000, netProfit: 3000 }],
      platforms: [{ platform: "smartstore", totalSales: 10000, netProfit: 3000 }],
      products: [
        {
          productCode: "P-001",
          productName: "프리미엄 무선 충전기",
          optionName: "화이트",
          platform: "smartstore",
          quantity: 1,
          totalSales: 10000,
          totalCost: 7000,
          salesFee: 350,
          paymentFee: 234,
          fixedFee: 0,
          feeTotal: 584,
          shippingCost: 3000,
          netProfit: 3000,
          marginRate: 0.3,
          profitStatus: "healthy",
        },
      ],
    },
    validationReport: {
      missingCostOrders: [],
      suspectedMissingShippingCostOrders: [],
      suspectedMissingFeeRulePlatforms: [
        {
          platform: "smartstore",
          orderCount: 2,
          orderIds: ["ORDER-002", "ORDER-003"],
        },
      ],
      lossProducts: [],
      lowMarginProducts: [],
      excludedOrders: [],
    },
  };
}
