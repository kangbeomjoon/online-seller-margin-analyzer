"use client";

import type { ChangeEvent } from "react";
import { FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import type { SampleDataCsvs } from "@/lib/sample-data/loadSampleData";

type CsvKey = keyof SampleDataCsvs;
type DataSource = "empty" | "sample" | "upload";

interface FileUploadPanelProps {
  isLoading: boolean;
  loadedFileCount: number;
  dataSource: DataSource;
  preparedCsvKeys: CsvKey[];
  onBuildUploadedReport: () => void;
  onFileChange: (
    key: CsvKey,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onLoadSampleData: () => void;
}

const FILE_INPUTS: { key: CsvKey; label: string }[] = [
  { key: "smartstoreCsv", label: "스마트스토어 CSV" },
  { key: "coupangCsv", label: "쿠팡 CSV" },
  { key: "productCostsCsv", label: "상품 원가표" },
  { key: "feeRulesCsv", label: "수수료 설정표" },
];

export function FileUploadPanel({
  isLoading,
  loadedFileCount,
  dataSource,
  preparedCsvKeys,
  onBuildUploadedReport,
  onFileChange,
  onLoadSampleData,
}: FileUploadPanelProps) {
  const sourceLabel =
    dataSource === "sample"
      ? "샘플 데이터 적용 중"
      : dataSource === "upload"
        ? "업로드 파일 기준"
        : "CSV 대기 중";

  return (
    <section className="min-w-0 rounded-md border border-[#d8dee8] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e4e9f0] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1f2933]">데이터 입력</h2>
          <p className="mt-1 text-sm text-[#697586]">
            CSV 4종을 기준으로 정산·마진 리포트를 생성합니다.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2f6f68] px-4 text-sm font-semibold text-white hover:bg-[#255b56] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={onLoadSampleData}
          >
            <RefreshCw className="h-4 w-4" />
            샘플 데이터로 체험하기
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#b7c1cc] bg-white px-4 text-sm font-semibold text-[#1f2933] hover:bg-[#f4f7fa]"
            type="button"
            onClick={onBuildUploadedReport}
          >
            <Upload className="h-4 w-4" />
            업로드 파일 분석
          </button>
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {FILE_INPUTS.map((input) => (
          <label
            className="flex min-h-[96px] flex-col justify-between rounded-md border border-[#d8dee8] bg-[#fbfcfd] p-3"
            key={input.key}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#1f2933]">
                <FileSpreadsheet className="h-4 w-4 text-[#3f6f68]" />
                {input.label}
              </span>
              {preparedCsvKeys.includes(input.key) ? (
                <span className="shrink-0 rounded-md bg-[#eaf2f0] px-2 py-1 text-[11px] font-semibold text-[#255b56]">
                  준비됨
                </span>
              ) : null}
            </span>
            <input
              className="mt-3 block w-full text-xs text-[#4b5563] file:mr-3 file:rounded-md file:border-0 file:bg-[#eaf2f0] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#255b56]"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => onFileChange(input.key, event)}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t border-[#eef2f6] px-4 py-3 text-sm text-[#697586] sm:flex-row sm:items-center sm:justify-between">
        <span>현재 준비된 파일: {loadedFileCount}/4</span>
        <span className="font-medium text-[#38635c]">{sourceLabel}</span>
      </div>
    </section>
  );
}
