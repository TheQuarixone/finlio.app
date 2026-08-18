// Renders Vitest's coverage JSON as a GitHub step-summary table.
// Reads apps/web/coverage/coverage-summary.json (the `json-summary` reporter).
import { readFileSync } from "node:fs";

const PATH = "apps/web/coverage/coverage-summary.json";

let data;
try {
  data = JSON.parse(readFileSync(PATH, "utf8"));
} catch {
  console.log("### Test coverage\n\n_No coverage report was produced._");
  process.exit(0);
}

const pct = (n) => `${n.toFixed(1)}%`;
const { total, ...files } = data;

const rows = Object.entries(files)
  .map(([file, m]) => [file.replace(`${process.cwd()}/apps/web/`, ""), m])
  // Worst-covered first: that's the list worth reading.
  .sort((a, b) => a[1].statements.pct - b[1].statements.pct)
  .slice(0, 15);

console.log("### Test coverage\n");
console.log(
  `**${pct(total.statements.pct)} statements** · ` +
    `${pct(total.branches.pct)} branches · ` +
    `${pct(total.functions.pct)} functions · ` +
    `${pct(total.lines.pct)} lines\n`
);
console.log("| File | Statements | Branches | Functions |");
console.log("| --- | --- | --- | --- |");
for (const [file, m] of rows) {
  console.log(
    `| \`${file}\` | ${pct(m.statements.pct)} | ${pct(m.branches.pct)} | ${pct(m.functions.pct)} |`
  );
}
