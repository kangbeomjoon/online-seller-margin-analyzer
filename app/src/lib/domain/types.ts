export type Platform = "smartstore" | "coupang";

export type OrderStatus =
  | "paid"
  | "shipping"
  | "completed"
  | "canceled"
  | "returned";

export type ProfitStatus =
  | "healthy"
  | "low_margin"
  | "loss"
  | "missing_cost"
  | "excluded";

export interface RawSmartstoreOrder {
  주문일: string;
  주문번호: string;
  상품명: string;
  옵션명: string;
  수량: string;
  상품금액: string;
  배송비: string;
  할인금액: string;
  결제금액: string;
  주문상태: string;
}

export interface RawCoupangOrder {
  결제일: string;
  주문번호: string;
  노출상품명: string;
  옵션명: string;
  구매수량: string;
  판매가: string;
  배송비: string;
  쿠폰할인: string;
  정산예정금액: string;
  주문상태: string;
}

export interface ProductCost {
  productCode: string;
  productName: string;
  optionName: string;
  unitCost: number;
  defaultShippingCost: number;
  packagingCost: number;
  otherCost: number;
}

export interface FeeRule {
  platform: Platform;
  baseFeeRate: number;
  paymentFeeRate: number;
  fixedFeePerOrder: number;
}

export interface StandardOrder {
  platform: Platform;
  orderDate: string;
  orderMonth: string;
  orderId: string;
  productName: string;
  optionName: string;
  quantity: number;
  grossSales: number;
  discountAmount: number;
  paidAmount: number;
  settlementAmount: number | null;
  shippingFeeCharged: number;
  orderStatus: OrderStatus;
}

export interface CalculatedOrder extends StandardOrder {
  productCode: string | null;
  unitCost: number | null;
  shippingCost: number | null;
  packagingCost: number | null;
  otherCost: number | null;
  salesFee: number;
  paymentFee: number;
  fixedFee: number;
  totalCost: number | null;
  netProfit: number | null;
  marginRate: number | null;
  profitStatus: ProfitStatus;
}
