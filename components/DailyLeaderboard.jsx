"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, ExternalLink, Flame, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rankUsers } from "@/lib/daily/ranking.mjs";

const COLUMNS = [
  { sort: "streak", label: "Streak" },
  { sort: "best", label: "Best" },
  { sort: "today", label: "Today" },
  { sort: "total", label: "Solved" },
  { sort: "points", label: "Points" },
  { sort: "time", label: "Latest Solve" },
];

const TABS = [
  { sort: "streak", label: "Streak" },
  { sort: "today", label: "Today" },
  { sort: "total", label: "Solved" },
  { sort: "points", label: "Points" },
  { sort: "best", label: "Best" },
  { sort: "time", label: "Recent" },
];

const MEDALS = {
  1: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
  2: "bg-zinc-300/15 text-zinc-300 border-zinc-300/40",
  3: "bg-amber-700/20 text-amber-500 border-amber-600/40",
};

function formatSolveTime(iso) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function RankBadge({ rank }) {
  if (rank === null) return <span className="text-zinc-700 font-mono text-xs">–</span>;
  if (rank <= 3) {
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold ${MEDALS[rank]}`}
      >
        {rank}
      </span>
    );
  }
  return <span className="text-zinc-500 font-mono text-xs">{rank}</span>;
}

export default function DailyLeaderboard({ questionCount = 6 }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("streak");
  const [ascending, setAscending] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    axios
      .get("/api/daily/stats")
      .then((response) => setStats(response.data))
      .catch(() => setError("Could not load daily stats"));
  }, []);

  const ranked = useMemo(() => (stats?.users ? rankUsers(stats.users, sortBy) : []), [stats, sortBy]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? ranked.filter(
          (user) =>
            user.name.toLowerCase().includes(needle) ||
            user.cfHandle?.toLowerCase().includes(needle)
        )
      : ranked;
    return ascending ? [...matches].reverse() : matches;
  }, [ranked, query, ascending]);

  const activeCount = useMemo(
    () => (stats?.users ?? []).filter((u) => u.totalSolved > 0 || u.currentStreak > 0).length,
    [stats]
  );

  const cellTone = (column) => (column === sortBy ? "text-white" : "text-zinc-400");

  return (
    <section className="mt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-matrix-200/10 border border-matrix-200/20 flex items-center justify-center text-matrix-200">
            <Flame size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-mono font-bold text-white">Daily Leaderboard</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-matrix-200/10 text-matrix-200 border border-matrix-200/20">
                {activeCount} active
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-500">
              Members with the same stats share a rank
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member or handle"
            className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg bg-zinc-900/80 border border-white/10 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-matrix-200/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div
          role="tablist"
          aria-label="Rank by"
          className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900/70 border border-white/10 overflow-x-auto"
        >
          {TABS.map((tab) => (
            <button
              key={tab.sort}
              role="tab"
              aria-selected={sortBy === tab.sort}
              onClick={() => setSortBy(tab.sort)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                sortBy === tab.sort
                  ? "bg-matrix-200 text-black font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAscending((value) => !value)}
          aria-label={ascending ? "Showing lowest first" : "Showing highest first"}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/70 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:border-matrix-200/40 transition-colors"
        >
          {ascending ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          <span className="hidden sm:inline">{ascending ? "Lowest first" : "Highest first"}</span>
        </button>
      </div>

      {error && <div className="glass-card p-6 text-zinc-400">{error}</div>}
      {!stats && !error && <div className="glass-card h-64 animate-pulse" />}
      {stats && stats.count === 0 && (
        <div className="glass-card p-8 text-center text-zinc-400 font-mono">
          No stats recorded yet.
        </div>
      )}

      {stats && stats.count > 0 && (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent bg-zinc-950/40">
                <TableHead className="w-12 text-center font-mono text-xs text-zinc-500">#</TableHead>
                <TableHead className="font-mono text-xs text-zinc-500">Member</TableHead>
                {COLUMNS.map((column) => (
                  <TableHead
                    key={column.sort}
                    className={`text-center font-mono text-xs ${
                      column.sort === sortBy ? "text-matrix-200" : "text-zinc-500"
                    }`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-zinc-500 font-mono text-sm">
                    No members match &ldquo;{query}&rdquo;
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((user) => (
                  <TableRow key={user.key} className="border-white/5 hover:bg-matrix-200/5">
                    <TableCell className="text-center py-3">
                      <RankBadge rank={user.rank} />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{user.name}</span>
                        {user.cfHandle && (
                          <a
                            href={`https://codeforces.com/profile/${user.cfHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-matrix-200 transition-colors w-fit"
                          >
                            @{user.cfHandle}
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          user.currentStreak > 0 ? "text-matrix-200" : "text-zinc-600"
                        }`}
                      >
                        {user.currentStreak > 0 && <Flame size={12} />}
                        {user.currentStreak}
                      </span>
                    </TableCell>
                    <TableCell className={`text-center font-mono py-3 ${cellTone("best")}`}>
                      {user.longestStreak}
                    </TableCell>
                    <TableCell className="text-center font-mono py-3">
                      <span
                        className={
                          (user.solvedToday ?? 0) > 0
                            ? "px-2 py-0.5 rounded text-xs font-semibold bg-matrix-200/15 text-matrix-200 border border-matrix-200/30"
                            : "text-xs text-zinc-600"
                        }
                      >
                        {user.solvedToday ?? 0}/{questionCount}
                      </span>
                    </TableCell>
                    <TableCell className={`text-center font-mono py-3 ${cellTone("total")}`}>
                      {user.totalSolved}
                    </TableCell>
                    <TableCell className={`text-center font-mono py-3 ${cellTone("points")}`}>
                      {user.points ?? 0}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs py-3 text-zinc-500">
                      {formatSolveTime(user.todayCompletedAt || user.lastCompletedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {stats?.updatedAt && (
        <p className="text-[11px] text-zinc-500 mt-3 font-mono">
          Last synced with Codeforces: {new Date(stats.updatedAt).toLocaleString()}
        </p>
      )}
    </section>
  );
}
