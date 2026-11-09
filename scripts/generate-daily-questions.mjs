import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { DAILY_CONFIG } from "../lib/daily/config.mjs";
import { fetchProblemset } from "../lib/daily/codeforces.mjs";
import { eligibleProblems, pickDailyProblems } from "../lib/daily/selector.mjs";
import {
  DATE_PATTERN,
  dateInZone,
  findEntry,
  pruneHistory,
  usedProblemIds,
} from "../lib/daily/schedule.mjs";

const HISTORY_FILE = new URL("../json/daily/history.json", import.meta.url);

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  } catch (error) {
    throw new Error(`Could not read ${HISTORY_FILE.pathname}: ${error.message}`);
  }
}

function resolveDate() {
  const date = process.argv[2] ?? dateInZone(DAILY_CONFIG.timezone);
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Invalid date "${date}", expected YYYY-MM-DD`);
  }
  return date;
}

async function main() {
  const today = dateInZone(DAILY_CONFIG.timezone);
  const explicitDate = process.argv[2];
  const stored = readHistory();
  const history = explicitDate ? stored : stored.filter((entry) => entry.date <= today);
  if (history.length < stored.length) {
    console.warn(`[daily] Removed ${stored.length - history.length} pre-generated future set(s)`);
  }

  const target = explicitDate ? resolveDate() : today;
  let updated = history;

  if (!findEntry(history, target)) {
    const problemset = await fetchProblemset();
    const problems = eligibleProblems(problemset, DAILY_CONFIG);
    const excludeIds = usedProblemIds(history);
    const picked = pickDailyProblems({
      problems,
      slots: DAILY_CONFIG.slots,
      date: target,
      excludeIds,
      seed: `${target}:${randomUUID()}`,
    });
    const repeated = picked.filter((problem) => excludeIds.includes(problem.id));
    if (repeated.length > 0) {
      console.warn(
        `[daily] Pool exhausted for some ranges, repeated: ${repeated.map((p) => p.id).join(", ")}`
      );
    }
    updated = [...history, { date: target, problems: picked }];
    console.log(`[daily] Prepared ${picked.length} questions for ${target}: ${picked.map((p) => p.id).join(", ")}`);
  }

  const result = pruneHistory(updated, DAILY_CONFIG.historyDays);
  if (JSON.stringify(result) === JSON.stringify(stored)) {
    console.log("[daily] Questions are already up to date, nothing to do");
    return;
  }
  fs.writeFileSync(HISTORY_FILE, `${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(`[daily] Generation failed: ${error.message}`);
  process.exit(1);
});
