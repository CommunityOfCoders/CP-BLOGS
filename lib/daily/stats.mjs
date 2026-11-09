import { getDayWindow, shiftDate } from "./schedule.mjs";

function unionByDate(a = {}, b = {}) {
  const merged = {};
  for (const date of new Set([...Object.keys(a), ...Object.keys(b)])) {
    merged[date] = [...new Set([...(a[date] ?? []), ...(b[date] ?? [])])];
  }
  return merged;
}

export function findSolves({ submissions, history, timezone }) {
  const timesById = new Map();
  for (const { id, at } of submissions) {
    timesById.set(id, [...(timesById.get(id) ?? []), at]);
  }

  const solves = {};
  const lateSolves = {};
  for (const entry of history) {
    const { start, end } = getDayWindow(entry.date, timezone);
    for (const problem of entry.problems) {
      const times = timesById.get(problem.id) ?? [];
      if (times.some((at) => at >= start && at < end)) {
        solves[entry.date] = [...(solves[entry.date] ?? []), problem.id];
      } else if (times.some((at) => at >= end)) {
        lateSolves[entry.date] = [...(lateSolves[entry.date] ?? []), problem.id];
      }
    }
  }
  return { solves, lateSolves };
}

export function mergeSolves(existing = {}, found = {}) {
  const solves = unionByDate(existing.solves, found.solves);
  const lateSolves = unionByDate(existing.lateSolves, found.lateSolves);
  for (const date of Object.keys(lateSolves)) {
    lateSolves[date] = lateSolves[date].filter((id) => !(solves[date] ?? []).includes(id));
  }
  return { solves, lateSolves };
}

export function pruneSolves({ solves = {}, lateSolves = {} }, history) {
  const dates = new Set(history.map((entry) => entry.date));
  const keep = (byDate) =>
    Object.fromEntries(
      Object.entries(byDate).filter(([date, ids]) => dates.has(date) && ids.length > 0)
    );
  return { solves: keep(solves), lateSolves: keep(lateSolves) };
}

export function computeStats({ solves = {}, lateSolves = {} }, history, today, options) {
  const { minSolvesForStreak, lateSolvesCount, slotCount } = options;
  const problemsByDate = new Map(history.map((entry) => [entry.date, entry.problems]));

  const counted = [];
  for (const [date, problems] of problemsByDate) {
    const ids = new Set([
      ...(solves[date] ?? []),
      ...(lateSolvesCount ? lateSolves[date] ?? [] : []),
    ]);
    for (const problem of problems) {
      if (ids.has(problem.id)) counted.push({ ...problem, date });
    }
  }

  const solvedBySlot = Array.from({ length: slotCount }, () => 0);
  for (const problem of counted) {
    if (problem.slot >= 1 && problem.slot <= slotCount) solvedBySlot[problem.slot - 1]++;
  }

  const streakDays = new Set(
    Object.entries(solves)
      .filter(([date, ids]) => problemsByDate.has(date) && ids.length >= minSolvesForStreak)
      .map(([date]) => date)
  );

  let currentStreak = 0;
  let cursor = streakDays.has(today) ? today : shiftDate(today, -1);
  while (streakDays.has(cursor)) {
    currentStreak++;
    cursor = shiftDate(cursor, -1);
  }

  let longestStreak = 0;
  let run = 0;
  let previous = null;
  for (const date of [...streakDays].sort()) {
    run = previous !== null && shiftDate(previous, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }

  return {
    totalSolved: counted.length,
    currentStreak,
    longestStreak,
    solvedToday: (solves[today] ?? []).length,
    solvedBySlot,
    lastSolvedDate: counted.reduce((latest, p) => (p.date > latest ? p.date : latest), "") || null,
    points: counted.reduce((sum, problem) => sum + problem.rating, 0),
  };
}

export { rankUsers } from "./ranking.mjs";
