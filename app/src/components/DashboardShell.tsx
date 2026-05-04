"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { buildSampleReport, type SampleReport } from "@/lib/sample-data/buildSampleReport";
import { loadSampleData, type SampleDataCsvs } from "@/lib/sample-data/loadSampleData";
import { FileUploadPanel } from "./FileUploadPanel";
import { KpiSummary } from "./KpiSummary";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { PlatformComparisonChart } from "./PlatformComparisonChart";
import { ProductMarginTable } from "./ProductMarginTable";
import { ValidationPanel } from "./ValidationPanel";
import { DownloadPanel } from "./DownloadPanel";

type CsvKey = keyof SampleDataCsvs;
type CsvInputState = Partial<Record<CsvKey, string | Promise<string>>>;
type DataSource = "empty" | "sample" | "upload";

const EMPTY_CSVS: CsvInputState = {};

export function DashboardShell() {
  const [csvs, setCsvs] = useState<CsvInputState>(EMPTY_CSVS);
  const [dataSource, setDataSource] = useState<DataSource>("empty");
  const [report, setReport] = useState<SampleReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const didAutoLoadSample = useRef(false);

  const loadedFileCount = useMemo(
    () => Object.values(csvs).filter(Boolean).length,
    [csvs],
  );
  const preparedCsvKeys = useMemo(
    () =>
      (Object.entries(csvs) as [CsvKey, string | Promise<string> | undefined][])
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key),
    [csvs],
  );

  useEffect(() => {
    if (
      didAutoLoadSample.current ||
      !new URLSearchParams(window.location.search).has("sample")
    ) {
      return;
    }

    didAutoLoadSample.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    void loadSampleData()
      .then((sampleCsvs) => {
        setCsvs(sampleCsvs);
        setDataSource("sample");
        setReport(buildSampleReport(sampleCsvs));
      })
      .catch((error: unknown) => {
        setErrorMessage(toErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleLoadSampleData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const sampleCsvs = await loadSampleData();
      setCsvs(sampleCsvs);
      setDataSource("sample");
      setReport(buildSampleReport(sampleCsvs));
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileChange(
    key: CsvKey,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setCsvs((current) => ({
      ...current,
      [key]: file.text(),
    }));
    setDataSource("upload");
  }

  async function handleBuildUploadedReport() {
    setErrorMessage(null);

    try {
      const resolvedCsvs = await resolveCsvs(csvs);
      setReport(buildSampleReport(resolvedCsvs));
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9] text-[#202124]">
      <div className="mx-auto flex max-w-[1440px] min-w-0 flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-[#d8dee8] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#38635c]">
              온라인 셀러 정산·마진 자동 분석기
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#1f2933] sm:text-3xl">
              셀러 마진 리포트 자동화 대시보드
            </h1>
          </div>
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:w-auto">
            <StatusBadge label="CSV" value={`${loadedFileCount}/4`} />
            <StatusBadge
              label="주문"
              value={report ? `${report.calculatedOrders.length}건` : "-"}
            />
            <StatusBadge
              label="상품"
              value={report ? `${report.metrics.products.length}개` : "-"}
            />
            <StatusBadge label="기준" value="2026 샘플" />
          </div>
        </header>

        <FileUploadPanel
          isLoading={isLoading}
          loadedFileCount={loadedFileCount}
          preparedCsvKeys={preparedCsvKeys}
          dataSource={dataSource}
          onBuildUploadedReport={handleBuildUploadedReport}
          onFileChange={handleFileChange}
          onLoadSampleData={handleLoadSampleData}
        />

        {errorMessage ? (
          <div className="flex items-center gap-2 rounded-md border border-[#f0b8a8] bg-[#fff4ef] px-4 py-3 text-sm font-medium text-[#8c2f1b]">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        ) : null}

        {report ? (
          <>
            <KpiSummary metrics={report.metrics} />
            <section className="grid min-w-0 gap-4 xl:grid-cols-2">
              <MonthlyTrendChart data={report.metrics.monthly} />
              <PlatformComparisonChart data={report.metrics.platforms} />
            </section>
            <ProductMarginTable products={report.metrics.products} />
            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
              <ValidationPanel report={report.validationReport} />
              <DownloadPanel report={report} />
            </section>
          </>
        ) : (
          <section className="grid min-h-[360px] place-items-center rounded-md border border-dashed border-[#bdc6d2] bg-white">
            <div className="flex max-w-md flex-col items-center gap-3 text-center">
              <RefreshCw className="h-8 w-8 text-[#3f6f68]" />
              <p className="text-lg font-semibold text-[#1f2933]">
                샘플 데이터로 대시보드를 채워 확인하세요.
              </p>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2f6f68] px-4 text-sm font-semibold text-white hover:bg-[#255b56]"
                type="button"
                onClick={handleLoadSampleData}
              >
                <RefreshCw className="h-4 w-4" />
                샘플 데이터로 체험하기
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[#d8dee8] bg-white px-3 py-2">
      <div className="text-xs font-medium text-[#697586]">{label}</div>
      <div className="mt-1 font-semibold text-[#1f2933]">{value}</div>
    </div>
  );
}

async function resolveCsvs(
  csvs: CsvInputState,
): Promise<SampleDataCsvs> {
  const entries = await Promise.all(
    (Object.entries(csvs) as [CsvKey, string | Promise<string> | undefined][])
      .map(async ([key, value]) => [key, await value] as const),
  );
  const resolvedCsvs = Object.fromEntries(entries) as Partial<SampleDataCsvs>;

  if (
    !resolvedCsvs.smartstoreCsv ||
    !resolvedCsvs.coupangCsv ||
    !resolvedCsvs.productCostsCsv ||
    !resolvedCsvs.feeRulesCsv
  ) {
    throw new Error("4개 CSV 파일을 모두 업로드해야 합니다.");
  }

  return resolvedCsvs as SampleDataCsvs;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "처리 중 오류가 발생했습니다.";
}
