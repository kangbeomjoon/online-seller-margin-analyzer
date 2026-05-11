import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileUploadPanel } from "../components/FileUploadPanel";
import type { SampleDataCsvs } from "../lib/sample-data/loadSampleData";

const ALL_CSV_KEYS: (keyof SampleDataCsvs)[] = [
  "smartstoreCsv",
  "coupangCsv",
  "productCostsCsv",
  "feeRulesCsv",
];

describe("FileUploadPanel", () => {
  const defaultProps = {
    isLoading: false,
    loadedFileCount: 0,
    dataSource: "empty" as const,
    preparedCsvKeys: [],
    selectedFileNames: {},
    onBuildUploadedReport: vi.fn(),
    onFileChange: vi.fn(),
    onFileDrop: vi.fn(),
    onLoadSampleData: vi.fn(),
    onStartManualUpload: vi.fn(),
  };

  it("allows switching from applied sample data to a fresh manual upload flow", () => {
    const onStartManualUpload = vi.fn();

    render(
      <FileUploadPanel
        {...defaultProps}
        loadedFileCount={4}
        dataSource="sample"
        preparedCsvKeys={ALL_CSV_KEYS}
        onStartManualUpload={onStartManualUpload}
      />,
    );

    const manualUploadButton = screen.getByRole("button", {
      name: "처음부터 직접 업로드",
    });

    expect(manualUploadButton).toBeEnabled();
    expect(screen.getByText("샘플 데이터 적용 완료")).toBeInTheDocument();

    fireEvent.click(manualUploadButton);

    expect(onStartManualUpload).toHaveBeenCalledOnce();
  });

  it("accepts a CSV dropped on a platform file card", () => {
    const onFileDrop = vi.fn();
    const smartstoreFile = new File(["주문일,주문번호"], "smartstore.csv", {
      type: "text/csv",
    });

    render(<FileUploadPanel {...defaultProps} onFileDrop={onFileDrop} />);

    const dropZone = screen.getByText("스마트스토어 CSV").closest("label");

    expect(dropZone).not.toBeNull();

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [smartstoreFile],
      },
    });

    expect(onFileDrop).toHaveBeenCalledWith("smartstoreCsv", smartstoreFile);
  });
});
