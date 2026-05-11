import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardShell } from "../components/DashboardShell";

describe("DashboardShell", () => {
  it("increments the CSV count as each file input receives a file", () => {
    render(<DashboardShell />);

    const smartstoreCard = screen.getByText("스마트스토어 CSV").closest("label");
    const coupangCard = screen.getByText("쿠팡 CSV").closest("label");

    expect(smartstoreCard).not.toBeNull();
    expect(coupangCard).not.toBeNull();
    expect(screen.getByText("0/4")).toBeInTheDocument();

    const smartstoreInput = smartstoreCard!.querySelector("input[type=file]");
    const coupangInput = coupangCard!.querySelector("input[type=file]");

    expect(smartstoreInput).not.toBeNull();
    expect(coupangInput).not.toBeNull();

    fireEvent.change(smartstoreInput!, {
      target: {
        files: [
          new File(["주문일,주문번호"], "smartstore-orders.csv", {
            type: "text/csv",
          }),
        ],
      },
    });

    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.getByText("smartstore-orders.csv")).toBeInTheDocument();

    fireEvent.change(coupangInput!, {
      target: {
        files: [
          new File(["결제일,주문번호"], "coupang-orders.csv", {
            type: "text/csv",
          }),
        ],
      },
    });

    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByText("coupang-orders.csv")).toBeInTheDocument();
  });

  it("prevents the browser default action when files are dropped outside upload cards", () => {
    render(<DashboardShell />);

    const dropEvent = new Event("drop", {
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperty(dropEvent, "dataTransfer", {
      value: {
        files: [
          new File(["주문일,주문번호"], "smartstore-orders.csv", {
            type: "text/csv",
          }),
        ],
      },
    });

    window.dispatchEvent(dropEvent);

    expect(dropEvent.defaultPrevented).toBe(true);
    expect(screen.getByText("0/4")).toBeInTheDocument();
  });

  it("accepts a known CSV dropped on the page instead of letting the browser download it", () => {
    render(<DashboardShell />);

    const main = screen.getByRole("main");
    const smartstoreFile = new File(
      ["주문일,주문번호"],
      "smartstore-orders.csv",
      {
        type: "text/csv",
      },
    );

    fireEvent.drop(main, {
      dataTransfer: {
        files: [smartstoreFile],
      },
    });

    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.getByText("smartstore-orders.csv")).toBeInTheDocument();
  });

  it("shows guidance when the dropped item is not exposed as a file", () => {
    render(<DashboardShell />);

    fireEvent.drop(screen.getByRole("main"), {
      dataTransfer: {
        files: [],
        types: ["text/uri-list"],
      },
    });

    expect(
      screen.getByText(
        "다운로드 목록 항목은 앱이 파일로 받을 수 없습니다. Finder에서 CSV 파일을 끌어오거나 파일 선택을 사용하세요.",
      ),
    ).toBeInTheDocument();
  });
});
