"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AlertCircle, ExternalLink, RotateCcw } from "lucide-react";
import DailyLeaderboard from "@/components/DailyLeaderboard";
import DailyCalendar from "@/components/DailyCalendar";

const CACHE_MS = 5 * 60 * 1000;

const urlFor = (date) => (date ? `/api/daily?date=${date}` : "/api/daily");
const readDateParam = () => new URLSearchParams(window.location.search).get("date") || "";

export default function DailyQuestionsPage() {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({ today: "", availableDates: [] });
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const cache = useRef(new Map());
  const latestRequest = useRef(0);

  const load = useCallback(async (date) => {
    const requestId = ++latestRequest.current;
    const key = urlFor(date);
    setError(null);

    const apply = (payload) => {
      setData(payload);
      setSelectedDate(payload.date);
      setMeta({ today: payload.today, availableDates: payload.availableDates });
      setLoading(false);
    };

    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      apply(cached.payload);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(key);
      if (requestId !== latestRequest.current) return;
      cache.current.set(key, { payload: response.data, at: Date.now() });
      apply(response.data);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      const payload = err.response?.data;
      setData(null);
      setError(payload?.error || "Could not load the questions");
      if (payload?.availableDates) {
        setMeta({ today: payload.today, availableDates: payload.availableDates });
      }
      setSelectedDate(date);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(readDateParam());
    const onPopState = () => load(readDateParam());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [load]);

  const selectDate = (date) => {
    const target = date === meta.today ? "" : date;
    if (date === selectedDate && !error) return;
    const url = new URL(window.location.href);
    if (target) {
      url.searchParams.set("date", target);
    } else {
      url.searchParams.delete("date");
    }
    if (url.href !== window.location.href) window.history.pushState({}, "", url);
    load(target);
  };

  const isPast = Boolean(data && !data.stale && meta.today && selectedDate !== meta.today);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-white mb-3">
            <span className="bg-gradient-to-r from-matrix-100 via-matrix-200 to-emerald-400 bg-clip-text text-transparent">
              Daily Questions
            </span>
          </h1>
          <p className="text-zinc-400 text-lg">Six new problems every day</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-8">
          <DailyCalendar
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            availableDates={meta.availableDates}
            todayDate={meta.today}
          />
          {isPast && (
            <p className="text-xs font-mono text-zinc-500">
              Practice mode: solving past questions won&apos;t update the leaderboard.
            </p>
          )}
          {data?.stale && (
            <p className="text-xs font-mono text-zinc-500">
              The set for today is not ready yet, showing the latest available.
            </p>
          )}
        </div>

        {loading && !data && (
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card h-28 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="glass-card p-8 text-center mb-12 border border-red-500/20 bg-red-950/10">
            <AlertCircle className="mx-auto text-red-400 mb-3" size={32} />
            <h3 className="text-lg font-mono text-white mb-2">{error}</h3>
            <p className="text-sm text-zinc-400 mb-5">
              Pick a highlighted date from the calendar to see its questions.
            </p>
            {meta.today && (
              <button
                onClick={() => selectDate(meta.today)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-matrix-200 text-black font-mono font-medium text-sm hover:bg-matrix-100 transition-colors"
              >
                <RotateCcw size={16} /> Back to today
              </button>
            )}
          </div>
        )}

        {data && (
          <div
            className={`grid md:grid-cols-2 gap-4 mb-12 transition-opacity ${
              loading ? "opacity-50" : ""
            }`}
          >
            {data.problems.map((problem) => (
              <a
                key={problem.id}
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-5 hover:border-matrix-200/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-matrix-200 text-lg">Q{problem.slot}</span>
                    <h3 className="font-semibold text-white group-hover:text-matrix-200 transition-colors">
                      {problem.name}
                    </h3>
                  </div>
                  <ExternalLink
                    className="text-zinc-500 group-hover:text-matrix-200 transition-colors flex-shrink-0"
                    size={18}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-matrix-200/10 text-matrix-200 border border-matrix-200/20">
                    {problem.rating}
                  </span>
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        )}

        <DailyLeaderboard questionCount={data?.count ?? 6} />
      </div>
    </div>
  );
}
