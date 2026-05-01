import { describe, expect, it } from "vitest";
import { parseCsv } from "../lib/csv/parseCsv";
import {
  mapCoupangOrder,
  mapSmartstoreOrder,
  normalizeOrderStatus,
} from "../lib/csv/platformMappers";
import { normalizeOrders } from "../lib/domain/normalizeOrders";
import type { RawCoupangOrder, RawSmartstoreOrder } from "../lib/domain/types";

describe("CSV parsing and order normalization", () => {
  it("parses header-based CSV rows and skips blank lines", () => {
    const csv = `주문일,주문번호,상품명,옵션명,수량,상품금액,배송비,할인금액,결제금액,주문상태
2026-01-03,SS-20260103-001,프리미엄 무선 충전기,화이트,2,39800,3000,2000,40800,구매확정

`;

    const rows = parseCsv<RawSmartstoreOrder>(csv);

    expect(rows).toEqual([
      {
        주문일: "2026-01-03",
        주문번호: "SS-20260103-001",
        상품명: "프리미엄 무선 충전기",
        옵션명: "화이트",
        수량: "2",
        상품금액: "39800",
        배송비: "3000",
        할인금액: "2000",
        결제금액: "40800",
        주문상태: "구매확정",
      },
    ]);
  });

  it("maps a smartstore row to the standard order shape", () => {
    const row: RawSmartstoreOrder = {
      주문일: "2026-01-03",
      주문번호: "SS-20260103-001",
      상품명: "프리미엄 무선 충전기",
      옵션명: "화이트",
      수량: "2",
      상품금액: "39800",
      배송비: "3000",
      할인금액: "2000",
      결제금액: "40800",
      주문상태: "구매확정",
    };

    expect(mapSmartstoreOrder(row)).toEqual({
      platform: "smartstore",
      orderDate: "2026-01-03",
      orderMonth: "2026-01",
      orderId: "SS-20260103-001",
      productName: "프리미엄 무선 충전기",
      optionName: "화이트",
      quantity: 2,
      grossSales: 39800,
      discountAmount: 2000,
      paidAmount: 40800,
      settlementAmount: null,
      shippingFeeCharged: 3000,
      orderStatus: "completed",
    });
  });

  it("maps a coupang row to the same standard order shape", () => {
    const row: RawCoupangOrder = {
      결제일: "2026-01-04",
      주문번호: "CP-20260104-001",
      노출상품명: "프리미엄 무선 충전기",
      옵션명: "화이트",
      구매수량: "1",
      판매가: "19900",
      배송비: "0",
      쿠폰할인: "1000",
      정산예정금액: "17580",
      주문상태: "배송완료",
    };

    expect(mapCoupangOrder(row)).toEqual({
      platform: "coupang",
      orderDate: "2026-01-04",
      orderMonth: "2026-01",
      orderId: "CP-20260104-001",
      productName: "프리미엄 무선 충전기",
      optionName: "화이트",
      quantity: 1,
      grossSales: 19900,
      discountAmount: 1000,
      paidAmount: 18900,
      settlementAmount: 17580,
      shippingFeeCharged: 0,
      orderStatus: "completed",
    });
  });

  it("normalizes smartstore and coupang rows into a single order list", () => {
    const smartstoreRows: RawSmartstoreOrder[] = [
      {
        주문일: "2026-01-03",
        주문번호: "SS-20260103-001",
        상품명: "프리미엄 무선 충전기",
        옵션명: "화이트",
        수량: "2",
        상품금액: "39800",
        배송비: "3000",
        할인금액: "2000",
        결제금액: "40800",
        주문상태: "구매확정",
      },
    ];
    const coupangRows: RawCoupangOrder[] = [
      {
        결제일: "2026-01-04",
        주문번호: "CP-20260104-001",
        노출상품명: "프리미엄 무선 충전기",
        옵션명: "화이트",
        구매수량: "1",
        판매가: "19900",
        배송비: "0",
        쿠폰할인: "1000",
        정산예정금액: "17580",
        주문상태: "배송완료",
      },
    ];

    const orders = normalizeOrders({ smartstoreRows, coupangRows });

    expect(orders.map((order) => order.platform)).toEqual([
      "smartstore",
      "coupang",
    ]);
    expect(orders.map((order) => order.orderId)).toEqual([
      "SS-20260103-001",
      "CP-20260104-001",
    ]);
  });

  it.each([
    ["구매확정", "completed"],
    ["배송완료", "completed"],
    ["결제완료", "paid"],
    ["배송중", "shipping"],
    ["취소", "canceled"],
    ["반품", "returned"],
  ] as const)("normalizes %s status to %s", (rawStatus, normalizedStatus) => {
    expect(normalizeOrderStatus(rawStatus)).toBe(normalizedStatus);
  });
});
