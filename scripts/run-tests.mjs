import { spawnSync } from "node:child_process";

const args = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const result = spawnSync(
  process.execPath,
  [new URL("../node_modules/vitest/vitest.mjs", import.meta.url).pathname, "run", ...args],
  { stdio: "inherit" }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
