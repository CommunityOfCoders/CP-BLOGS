const count = (value) => value ?? 0;
const NO_TIME = Number.MAX_SAFE_INTEGER;

const toMs = (iso) => {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(ms) ? null : ms;
};

const latestSolveMs = (user) => toMs(user.lastCompletedAt) ?? toMs(user.lastSolvedDate);
const todaySolveMs = (user) => toMs(user.todayCompletedAt) ?? toMs(user.lastCompletedAt);

export const SORTS = {
  streak: {
    isActive: (user) => count(user.currentStreak) > 0,
    keys: [(u) => count(u.currentStreak), (u) => count(u.totalSolved), (u) => count(u.points)],
  },
  today: {
    isActive: (user) => count(user.solvedToday) > 0,
    keys: [
      (u) => count(u.solvedToday),
      (u) => -(todaySolveMs(u) ?? NO_TIME),
      (u) => count(u.currentStreak),
    ],
  },
  total: {
    isActive: (user) => count(user.totalSolved) > 0,
    keys: [(u) => count(u.totalSolved), (u) => count(u.points), (u) => count(u.currentStreak)],
  },
  best: {
    isActive: (user) => count(user.longestStreak) > 0,
    keys: [(u) => count(u.longestStreak), (u) => count(u.currentStreak), (u) => count(u.totalSolved)],
  },
  points: {
    isActive: (user) => count(user.points) > 0,
    keys: [(u) => count(u.points), (u) => count(u.totalSolved)],
  },
  time: {
    isActive: (user) => latestSolveMs(user) !== null,
    keys: [(u) => latestSolveMs(u) ?? 0, (u) => count(u.solvedToday)],
  },
};

const ALIASES = { longestStreak: "best", recent: "time" };

const compareKeys = (keys, a, b) => {
  for (const key of keys) {
    const diff = key(b) - key(a);
    if (diff !== 0) return diff;
  }
  return 0;
};

export function rankUsers(users, sortBy = "streak") {
  const sort = SORTS[ALIASES[sortBy] ?? sortBy] ?? SORTS.streak;
  const list = Array.isArray(users)
    ? users
    : Object.entries(users).map(([key, user]) => ({ key, ...user }));

  const ordered = [...list].sort(
    (a, b) => compareKeys(sort.keys, a, b) || a.name.localeCompare(b.name)
  );

  return ordered.map((user) => {
    if (!sort.isActive(user)) return { ...user, rank: null };
    const ahead = ordered.filter((other) => compareKeys(sort.keys, user, other) > 0).length;
    return { ...user, rank: ahead + 1 };
  });
}
