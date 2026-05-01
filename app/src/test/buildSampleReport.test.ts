import { describe, expect, it } from "vitest";
import { buildSampleReport } from "../lib/sample-data/buildSampleReport";

const smartstoreCsv = `주문일,주문번호,상품명,옵션명,수량,상품금액,배송비,할인금액,결제금액,주문상태
2026-01-03,SS-001,프리미엄 무선 충전기,화이트,2,39800,3000,2000,40800,구매확정
2026-01-04,SS-002,원가표에 없는 상품,기본,1,12000,3000,0,15000,배송완료`;

const coupangCsv = `결제일,주문번호,노출상품명,옵션명,구매수량,판매가,배송비,쿠폰할인,정산예정금액,주문상태
2026-02-03,CP-001,프리미엄 무선 충전기,화이트,1,19900,3000,0,18000,배송완료`;

const productCostsCsv = `상품코드,상품명,옵션명,매입원가,기본배송비,포장비,기타비용
P-001,프리미엄 무선 충전기,화이트,9200,3000,500,300`;

const feeRulesCsv = `플랫폼,기본수수료율,결제수수료율,주문당고정비
smartstore,0.035,0.018,0
coupang,0.085,0.022,150`;

describe("buildSampleReport", () => {
  it("builds calculated orders, dashboard metrics, and validation report from four CSV strings", () => {
    const report = buildSampleReport({
      smartstoreCsv,
      coupangCsv,
      productCostsCsv,
      feeRulesCsv,
    });

    expect(report.standardOrders).toHaveLength(3);
    expect(report.calculatedOrders).toHaveLength(3);
    expect(report.metrics.summary.totalSales).toBeGreaterThan(0);
    expect(report.metrics.products).toEqual([
      expect.objectContaining({
        productCode: "P-001",
        productName: "프리미엄 무선 충전기",
        platform: "smartstore",
      }),
      expect.objectContaining({
        productCode: "P-001",
        productName: "프리미엄 무선 충전기",
        platform: "coupang",
      }),
    ]);
    expect(report.validationReport.missingCostOrders).toEqual([
      expect.objectContaining({
        orderId: "SS-002",
        productName: "원가표에 없는 상품",
      }),
    ]);
  });
});
