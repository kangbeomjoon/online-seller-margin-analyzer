import { access, cp, mkdir } from "node:fs/promises";
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

const hasProjectSampleData = await pathExists(sampleDataDir);
const hasPublicSampleData = await Promise.all(
  files.map((file) => pathExists(join(publicSampleDataDir, file))),
).then((results) => results.every(Boolean));

if (!hasProjectSampleData && hasPublicSampleData) {
  process.exit(0);
}

await Promise.all(
  files.map((file) =>
    cp(join(sampleDataDir, file), join(publicSampleDataDir, file)),
  ),
);

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
