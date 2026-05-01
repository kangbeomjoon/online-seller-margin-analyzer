import { parseCsv } from "../csv/parseCsv";
import { calculateMargins } from "../domain/calculateMargins";
import {
  buildDashboardMetrics,
  type DashboardMetrics,
} from "../domain/aggregateMetrics";
import { normalizeOrders } from "../domain/normalizeOrders";
import type {
  CalculatedOrder,
  FeeRule,
  ProductCost,
  RawCoupangOrder,
  RawSmartstoreOrder,
  StandardOrder,
} from "../domain/types";
import {
  buildValidationReport,
  type ValidationReport,
} from "../domain/validations";
import type { SampleDataCsvs } from "./loadSampleData";

interface RawProductCost {
  상품코드: string;
  상품명: string;
  옵션명: string;
  매입원가: string;
  기본배송비: string;
  포장비: string;
  기타비용: string;
}

interface RawFeeRule {
  플랫폼: string;
  기본수수료율: string;
  결제수수료율: string;
  주문당고정비: string;
}

export interface SampleReport {
  standardOrders: StandardOrder[];
  calculatedOrders: CalculatedOrder[];
  metrics: DashboardMetrics;
  validationReport: ValidationReport;
}

export function buildSampleReport(csvs: SampleDataCsvs): SampleReport {
  const standardOrders = normalizeOrders({
    smartstoreRows: parseCsv<RawSmartstoreOrder>(csvs.smartstoreCsv),
    coupangRows: parseCsv<RawCoupangOrder>(csvs.coupangCsv),
  });
  const calculatedOrders = calculateMargins(
    standardOrders,
    parseCsv<RawProductCost>(csvs.productCostsCsv).map(mapProductCost),
    parseCsv<RawFeeRule>(csvs.feeRulesCsv).map(mapFeeRule),
  );

  return {
    standardOrders,
    calculatedOrders,
    metrics: buildDashboardMetrics(calculatedOrders),
    validationReport: buildValidationReport(calculatedOrders),
  };
}

function mapProductCost(row: RawProductCost): ProductCost {
  return {
    productCode: row.상품코드,
    productName: row.상품명,
    optionName: row.옵션명,
    unitCost: toNumber(row.매입원가),
    defaultShippingCost: toNumber(row.기본배송비),
    packagingCost: toNumber(row.포장비),
    otherCost: toNumber(row.기타비용),
  };
}

function mapFeeRule(row: RawFeeRule): FeeRule {
  if (row.플랫폼 !== "smartstore" && row.플랫폼 !== "coupang") {
    throw new Error(`Unsupported fee rule platform: ${row.플랫폼}`);
  }

  return {
    platform: row.플랫폼,
    baseFeeRate: toNumber(row.기본수수료율),
    paymentFeeRate: toNumber(row.결제수수료율),
    fixedFeePerOrder: toNumber(row.주문당고정비),
  };
}

function toNumber(value: string): number {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return 0;
  }

  return Number(trimmedValue);
}
