export interface SampleDataCsvs {
  smartstoreCsv: string;
  coupangCsv: string;
  productCostsCsv: string;
  feeRulesCsv: string;
}

const SAMPLE_DATA_PATHS = {
  smartstoreCsv: "/sample-data/smartstore-orders.csv",
  coupangCsv: "/sample-data/coupang-orders.csv",
  productCostsCsv: "/sample-data/product-costs.csv",
  feeRulesCsv: "/sample-data/fee-rules.csv",
} as const satisfies Record<keyof SampleDataCsvs, string>;

export async function loadSampleData(): Promise<SampleDataCsvs> {
  const [
    smartstoreCsv,
    coupangCsv,
    productCostsCsv,
    feeRulesCsv,
  ] = await Promise.all([
    fetchCsv(SAMPLE_DATA_PATHS.smartstoreCsv),
    fetchCsv(SAMPLE_DATA_PATHS.coupangCsv),
    fetchCsv(SAMPLE_DATA_PATHS.productCostsCsv),
    fetchCsv(SAMPLE_DATA_PATHS.feeRulesCsv),
  ]);

  return {
    smartstoreCsv,
    coupangCsv,
    productCostsCsv,
    feeRulesCsv,
  };
}

async function fetchCsv(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load sample data: ${path}`);
  }

  return response.text();
}
