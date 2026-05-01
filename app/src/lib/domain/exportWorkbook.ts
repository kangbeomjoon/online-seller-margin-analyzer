import ExcelJS from "exceljs";
import type { SampleReport } from "../sample-data/buildSampleReport";

export const FULL_REPORT_FILENAME = "seller-margin-report-2026-sample.xlsx";
export const PRODUCT_MARGIN_FILENAME =
  "product-margin-analysis-2026-sample.xlsx";
export const MONTHLY_SUMMARY_FILENAME =
  "monthly-profit-summary-2026-sample.xlsx";

export function createFullReportWorkbook(report: SampleReport): ExcelJS.Workbook {
  const workbook = createWorkbook();

  addStandardOrdersSheet(workbook, report);
  addProductMarginSheet(workbook, report);
  addMonthlySummarySheet(workbook, report);
  addPlatformSummarySheet(workbook, report);
  addValidationSheet(workbook, report);

  return workbook;
}

export function createProductMarginWorkbook(
  report: SampleReport,
): ExcelJS.Workbook {
  const workbook = createWorkbook();
  addProductMarginSheet(workbook, report);
  return workbook;
}

export function createMonthlySummaryWorkbook(
  report: SampleReport,
): ExcelJS.Workbook {
  const workbook = createWorkbook();
  addMonthlySummarySheet(workbook, report);
  return workbook;
}

function createWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "online-seller-margin-analyzer";
  workbook.created = new Date("2026-01-01T00:00:00.000Z");
  return workbook;
}

function addStandardOrdersSheet(
  workbook: ExcelJS.Workbook,
  report: SampleReport,
): void {
  const sheet = workbook.addWorksheet("표준 주문 데이터");
  sheet.columns = [
    { header: "플랫폼", key: "platform", width: 14 },
    { header: "주문일", key: "orderDate", width: 14 },
    { header: "주문월", key: "orderMonth", width: 12 },
    { header: "주문번호", key: "orderId", width: 22 },
    { header: "상품명", key: "productName", width: 24 },
    { header: "옵션명", key: "optionName", width: 14 },
    { header: "수량", key: "quantity", width: 10 },
    { header: "상품금액", key: "grossSales", width: 14 },
    { header: "할인금액", key: "discountAmount", width: 14 },
    { header: "결제금액", key: "paidAmount", width: 14 },
    { header: "주문상태", key: "orderStatus", width: 12 },
  ];
  sheet.addRows(report.standardOrders);
  styleSheet(sheet);
}

function addProductMarginSheet(
  workbook: ExcelJS.Workbook,
  report: SampleReport,
): void {
  const sheet = workbook.addWorksheet("상품별 마진 분석");
  sheet.columns = [
    { header: "상품코드", key: "productCode", width: 14 },
    { header: "상품명", key: "productName", width: 24 },
    { header: "옵션명", key: "optionName", width: 14 },
    { header: "플랫폼", key: "platform", width: 14 },
    { header: "판매수량", key: "quantity", width: 12 },
    { header: "매출", key: "totalSales", width: 14 },
    { header: "원가", key: "totalCost", width: 14 },
    { header: "수수료", key: "feeTotal", width: 14 },
    { header: "배송비", key: "shippingCost", width: 14 },
    { header: "순이익", key: "netProfit", width: 14 },
    { header: "마진율", key: "marginRate", width: 12 },
    { header: "상태", key: "profitStatus", width: 12 },
  ];
  sheet.addRows(report.metrics.products);
  styleSheet(sheet);
  formatCurrencyColumns(sheet, ["F", "G", "H", "I", "J"]);
  formatPercentColumn(sheet, "K");
}

function addMonthlySummarySheet(
  workbook: ExcelJS.Workbook,
  report: SampleReport,
): void {
  const sheet = workbook.addWorksheet("월별 요약");
  sheet.columns = [
    { header: "주문월", key: "orderMonth", width: 14 },
    { header: "매출", key: "totalSales", width: 14 },
    { header: "순이익", key: "netProfit", width: 14 },
  ];
  sheet.addRows(report.metrics.monthly);
  styleSheet(sheet);
  formatCurrencyColumns(sheet, ["B", "C"]);
}

function addPlatformSummarySheet(
  workbook: ExcelJS.Workbook,
  report: SampleReport,
): void {
  const sheet = workbook.addWorksheet("플랫폼별 요약");
  sheet.columns = [
    { header: "플랫폼", key: "platform", width: 14 },
    { header: "매출", key: "totalSales", width: 14 },
    { header: "순이익", key: "netProfit", width: 14 },
  ];
  sheet.addRows(report.metrics.platforms);
  styleSheet(sheet);
  formatCurrencyColumns(sheet, ["B", "C"]);
}

function addValidationSheet(
  workbook: ExcelJS.Workbook,
  report: SampleReport,
): void {
  const sheet = workbook.addWorksheet("검증 경고");
  sheet.columns = [
    { header: "구분", key: "category", width: 22 },
    { header: "플랫폼", key: "platform", width: 14 },
    { header: "주문번호/상품코드", key: "target", width: 24 },
    { header: "상품명", key: "productName", width: 24 },
    { header: "옵션명", key: "optionName", width: 14 },
    { header: "상태/수치", key: "value", width: 16 },
  ];
  sheet.addRows([
    ...report.validationReport.suspectedMissingFeeRulePlatforms.map(
      (warning) => ({
        category: "수수료 누락 의심",
        platform: warning.platform,
        target: warning.orderIds.join(", "),
        productName: "",
        optionName: "",
        value: `${warning.orderCount}건`,
      }),
    ),
    ...report.validationReport.missingCostOrders.map((warning) => ({
      category: "원가 미등록",
      platform: warning.platform,
      target: warning.orderId,
      productName: warning.productName,
      optionName: warning.optionName,
      value: warning.orderStatus,
    })),
    ...report.validationReport.suspectedMissingShippingCostOrders.map(
      (warning) => ({
        category: "배송비 누락 의심",
        platform: warning.platform,
        target: warning.orderId,
        productName: warning.productName,
        optionName: warning.optionName,
        value: warning.orderStatus,
      }),
    ),
    ...report.validationReport.lossProducts.map((warning) => ({
      category: "적자 상품",
      platform: warning.platform,
      target: warning.productCode,
      productName: warning.productName,
      optionName: warning.optionName,
      value: warning.netProfit,
    })),
    ...report.validationReport.lowMarginProducts.map((warning) => ({
      category: "저마진 상품",
      platform: warning.platform,
      target: warning.productCode,
      productName: warning.productName,
      optionName: warning.optionName,
      value: warning.marginRate,
    })),
    ...report.validationReport.excludedOrders.map((warning) => ({
      category: "계산 제외",
      platform: warning.platform,
      target: warning.orderId,
      productName: warning.productName,
      optionName: warning.optionName,
      value: warning.orderStatus,
    })),
  ]);
  styleSheet(sheet);
}

function styleSheet(sheet: ExcelJS.Worksheet): void {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF7" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function formatCurrencyColumns(
  sheet: ExcelJS.Worksheet,
  columns: string[],
): void {
  for (const column of columns) {
    sheet.getColumn(column).numFmt = '#,##0"원"';
  }
}

function formatPercentColumn(sheet: ExcelJS.Worksheet, column: string): void {
  sheet.getColumn(column).numFmt = "0.0%";
}
