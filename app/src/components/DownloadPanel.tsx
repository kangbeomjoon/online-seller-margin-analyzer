"use client";

import { Download } from "lucide-react";
import {
  FULL_REPORT_FILENAME,
  MONTHLY_SUMMARY_FILENAME,
  PRODUCT_MARGIN_FILENAME,
  createFullReportWorkbook,
  createMonthlySummaryWorkbook,
  createProductMarginWorkbook,
} from "@/lib/domain/exportWorkbook";
import type { SampleReport } from "@/lib/sample-data/buildSampleReport";
import type { Workbook } from "exceljs";

interface DownloadPanelProps {
  report: SampleReport;
}

export function DownloadPanel({ report }: DownloadPanelProps) {
  return (
    <section className="rounded-md border border-[#d8dee8] bg-white">
      <div className="border-b border-[#e4e9f0] px-4 py-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#1f2933]">
          <Download className="h-4 w-4 text-[#3f6f68]" />
          엑셀 다운로드
        </h2>
      </div>
      <div className="grid gap-2 p-4">
        <DownloadButton
          label="전체 리포트 다운로드"
          onClick={() =>
            downloadWorkbook(createFullReportWorkbook(report), FULL_REPORT_FILENAME)
          }
        />
        <DownloadButton
          label="상품별 마진 분석 다운로드"
          onClick={() =>
            downloadWorkbook(
              createProductMarginWorkbook(report),
              PRODUCT_MARGIN_FILENAME,
            )
          }
        />
        <DownloadButton
          label="월별 요약 다운로드"
          onClick={() =>
            downloadWorkbook(
              createMonthlySummaryWorkbook(report),
              MONTHLY_SUMMARY_FILENAME,
            )
          }
        />
      </div>
    </section>
  );
}

function DownloadButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#b7c1cc] bg-white px-4 text-sm font-semibold text-[#1f2933] hover:bg-[#f4f7fa]"
      type="button"
      onClick={onClick}
    >
      <Download className="h-4 w-4 text-[#3f6f68]" />
      {label}
    </button>
  );
}

async function downloadWorkbook(
  workbook: Workbook,
  filename: string,
): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
