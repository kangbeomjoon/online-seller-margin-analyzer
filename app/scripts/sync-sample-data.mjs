import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = join(appRoot, "..");
const sampleDataDir = join(projectRoot, "sample-data");
const publicSampleDataDir = join(appRoot, "public", "sample-data");

const files = [
  "smartstore-orders.csv",
  "coupang-orders.csv",
  "product-costs.csv",
  "fee-rules.csv",
];

await mkdir(publicSampleDataDir, { recursive: true });

await Promise.all(
  files.map((file) =>
    cp(join(sampleDataDir, file), join(publicSampleDataDir, file)),
  ),
);
