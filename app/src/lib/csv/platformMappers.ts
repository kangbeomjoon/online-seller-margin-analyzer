import type {
  OrderStatus,
  RawCoupangOrder,
  RawSmartstoreOrder,
  StandardOrder,
} from "../domain/types";

export function normalizeOrderStatus(status: string): OrderStatus {
  switch (status.trim()) {
    case "배송완료":
    case "구매확정":
      return "completed";
    case "결제완료":
      return "paid";
    case "배송중":
      return "shipping";
    case "취소":
      return "canceled";
    case "반품":
      return "returned";
    default:
      throw new Error(`Unsupported order status: ${status}`);
  }
}

export function mapSmartstoreOrder(row: RawSmartstoreOrder): StandardOrder {
  return {
    platform: "smartstore",
    orderDate: row.주문일,
    orderMonth: toOrderMonth(row.주문일),
    orderId: row.주문번호,
    productName: row.상품명,
    optionName: row.옵션명,
    quantity: toNumber(row.수량),
    grossSales: toNumber(row.상품금액),
    discountAmount: toNumber(row.할인금액),
    paidAmount: toNumber(row.결제금액),
    settlementAmount: null,
    shippingFeeCharged: toNumber(row.배송비),
    orderStatus: normalizeOrderStatus(row.주문상태),
  };
}

export function mapCoupangOrder(row: RawCoupangOrder): StandardOrder {
  const grossSales = toNumber(row.판매가);
  const shippingFeeCharged = toNumber(row.배송비);
  const discountAmount = toNumber(row.쿠폰할인);

  return {
    platform: "coupang",
    orderDate: row.결제일,
    orderMonth: toOrderMonth(row.결제일),
    orderId: row.주문번호,
    productName: row.노출상품명,
    optionName: row.옵션명,
    quantity: toNumber(row.구매수량),
    grossSales,
    discountAmount,
    paidAmount: grossSales + shippingFeeCharged - discountAmount,
    settlementAmount: toNullableNumber(row.정산예정금액),
    shippingFeeCharged,
    orderStatus: normalizeOrderStatus(row.주문상태),
  };
}

function toOrderMonth(date: string): string {
  return date.slice(0, 7);
}

function toNumber(value: string): number {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return 0;
  }

  return Number(trimmedValue);
}

function toNullableNumber(value: string): number | null {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  return Number(trimmedValue);
}
