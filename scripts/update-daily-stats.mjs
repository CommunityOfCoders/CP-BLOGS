import fs from "node:fs";
import { DAILY_CONFIG } from "../lib/daily/config.mjs";
import { fetchAcceptedSubmissions } from "../lib/daily/submissions.mjs";
import { dateInZone, getDayWindow } from "../lib/daily/schedule.mjs";
import { computeStats, findSolves, mergeSolves, pruneSolves } from "../lib/daily/stats.mjs";
import { formatAnnotations, formatRunReport, shouldFailRun } from "../lib/daily/report.mjs";

const HISTORY_FILE = new URL("../json/daily/history.json", import.meta.url);
const STATS_FILE = new URL("../json/daily/stats.json", import.meta.url);
const MEMBERS_FILE = new URL("../json/members.json", import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (error) {
    throw new Error(`Could not read ${file.pathname}: ${error.message}`);
  }
}

function trackedMembers() {
  return Object.entries(readJson(MEMBERS_FILE))
    .map(([key, member]) => ({
      key: key.trim(),
      name: member.name,
      handle: (member.cf_username ?? "").trim(),
      inClub: member.inClub,
    }))
    .filter((member) => member.inClub && member.handle);
}

async function main() {
  const { stats: options, timezone, slots } = DAILY_CONFIG;
  const history = readJson(HISTORY_FILE);
  if (history.length === 0) {
    console.log("[daily] No daily questions yet, skipping stats update");
    return;
  }

  const previous = readJson(STATS_FILE);
  const today = dateInZone(timezone);
  const count = process.argv.includes("--backfill")
    ? options.backfillSubmissionCount
    : options.submissionCount;
  const statsOptions = {
    minSolvesForStreak: options.minSolvesForStreak,
    lateSolvesCount: options.lateSolvesCount,
    slotCount: slots.length,
  };

  const members = trackedMembers();
  const users = {};
  const failures = [];

  for (const [index, member] of members.entries()) {
    const startedAt = Date.now();
    const known = previous.users[member.key];
    let found = {};
    let fetched = true;
    let submissions = [];

    try {
      submissions = await fetchAcceptedSubmissions(member.handle, { count });
      found = findSolves({ submissions, history, timezone });
    } catch (error) {
      fetched = false;
      failures.push({ ...member, reason: error.message, invalid: error.permanent, kept: Boolean(known) });
      console.error(`[daily] Skipping ${member.key} (${member.handle}): ${error.message}`);
    }

    if (fetched || known) {
      const solves = pruneSolves(mergeSolves(known, found), history);
      const computed = computeStats(solves, history, today, statsOptions);

      let latestSolveAt = null;
      let todaySolveAt = null;
      for (const entry of history) {
        const { start, end } = getDayWindow(entry.date, timezone);
        const isToday = entry.date === today;
        for (const problem of entry.problems) {
          if (solves.solves[entry.date]?.includes(problem.id)) {
            const sub = submissions.find((s) => s.id === problem.id && s.at >= start && s.at < end);
            if (sub) {
              if (!latestSolveAt || sub.at > latestSolveAt) latestSolveAt = sub.at;
              if (isToday && (!todaySolveAt || sub.at > todaySolveAt)) todaySolveAt = sub.at;
            }
          }
        }
      }

      const lastCompletedAt = latestSolveAt
        ? new Date(latestSolveAt * 1000).toISOString()
        : (known?.lastCompletedAt ?? (computed.lastSolvedDate ? `${computed.lastSolvedDate}T23:59:59.000Z` : null));

      const todayCompletedAt = todaySolveAt
        ? new Date(todaySolveAt * 1000).toISOString()
        : (computed.solvedToday > 0 ? (known?.todayCompletedAt ?? null) : null);

      users[member.key] = {
        name: member.name,
        cfHandle: member.handle,
        ...solves,
        ...computed,
        lastCompletedAt,
        todayCompletedAt,
      };
    }

    if (index < members.length - 1) {
      await sleep(options.requestGapMs - (Date.now() - startedAt));
    }
  }

  const changed = JSON.stringify(users) !== JSON.stringify(previous.users);
  if (changed) {
    const next = { updatedAt: new Date().toISOString(), users };
    fs.writeFileSync(STATS_FILE, `${JSON.stringify(next, null, 2)}\n`);
  }
  const saved = Object.keys(users).length;
  console.log(`[daily] Stats ${changed ? "updated" : "unchanged"}, ${saved}/${members.length} members saved`);
  formatAnnotations(failures).forEach((line) => console.log(line));

  if (process.env.GITHUB_STEP_SUMMARY) {
    const report = formatRunReport({ date: today, total: members.length, saved, changed, failures });
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  }

  if (shouldFailRun(failures.length, members.length, options.failureThreshold)) {
    console.error(
      `[daily] ${failures.length}/${members.length} members failed, treating as a systemic problem`
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[daily] Stats update failed: ${error.message}`);
  process.exit(1);
});
