import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSampleData } from "../lib/sample-data/loadSampleData";

describe("loadSampleData", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the four sample CSV files from public sample-data paths", async () => {
    const csvByPath = new Map([
      ["/sample-data/smartstore-orders.csv", "smartstore csv"],
      ["/sample-data/coupang-orders.csv", "coupang csv"],
      ["/sample-data/product-costs.csv", "product costs csv"],
      ["/sample-data/fee-rules.csv", "fee rules csv"],
    ]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const path = String(input);
        const csv = csvByPath.get(path);

        if (!csv) {
          return new Response("not found", { status: 404 });
        }

        return new Response(csv);
      });

    await expect(loadSampleData()).resolves.toEqual({
      smartstoreCsv: "smartstore csv",
      coupangCsv: "coupang csv",
      productCostsCsv: "product costs csv",
      feeRulesCsv: "fee rules csv",
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      "/sample-data/smartstore-orders.csv",
      "/sample-data/coupang-orders.csv",
      "/sample-data/product-costs.csv",
      "/sample-data/fee-rules.csv",
    ]);
  });

  it("throws a readable error when a sample CSV cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("missing", { status: 404, statusText: "Not Found" }),
    );

    await expect(loadSampleData()).rejects.toThrow(
      "Failed to load sample data: /sample-data/smartstore-orders.csv",
    );
  });
});
