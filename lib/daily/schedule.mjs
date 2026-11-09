export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function dateInZone(timezone, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function findEntry(history, date) {
  return history.find((entry) => entry.date === date) ?? null;
}

export function resolveEntry(history, date) {
  const exact = findEntry(history, date);
  if (exact) {
    return { entry: exact, stale: false };
  }
  const latest = history.reduce(
    (best, entry) => (best === null || entry.date > best.date ? entry : best),
    null
  );
  return { entry: latest, stale: latest !== null };
}

export function pruneHistory(history, days) {
  return [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
}

export function usedProblemIds(history) {
  return history.flatMap((entry) => entry.problems.map((problem) => problem.id));
}

export function shiftDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function zoneOffsetMs(timezone, instantMs) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instantMs))
      .map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

function startOfDaySeconds(date, timezone) {
  const [year, month, day] = date.split("-").map(Number);
  const localMidnight = Date.UTC(year, month - 1, day);
  const firstGuess = localMidnight - zoneOffsetMs(timezone, localMidnight);
  const start = localMidnight - zoneOffsetMs(timezone, firstGuess);
  return Math.floor(start / 1000);
}

export function getDayWindow(date, timezone) {
  return {
    start: startOfDaySeconds(date, timezone),
    end: startOfDaySeconds(shiftDate(date, 1), timezone),
  };
}

export function listDates(history) {
  return history.map((entry) => entry.date).sort();
}

export function publishedHistory(history, today) {
  return history.filter((entry) => entry.date <= today);
}

export function neighbourDate(dates, current, direction) {
  const sorted = [...dates].sort();
  return direction < 0
    ? sorted.filter((date) => date < current).at(-1) ?? null
    : sorted.find((date) => date > current) ?? null;
}

export function buildMonthGrid(year, month) {
  const leadingBlanks = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
  ];
}
