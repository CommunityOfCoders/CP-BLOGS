"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthGrid, neighbourDate } from "@/lib/daily/schedule.mjs";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const monthOf = (date) => {
  const [year, month] = date.split("-").map(Number);
  return { year, month: month - 1 };
};

const monthKey = ({ year, month }) => `${year}-${String(month + 1).padStart(2, "0")}`;

const formatLong = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const arrowClasses =
  "p-2 rounded-lg glass-card text-zinc-300 hover:text-matrix-200 hover:border-matrix-200/40 transition-all disabled:opacity-30 disabled:hover:text-zinc-300 disabled:hover:border-green-500/20 disabled:cursor-not-allowed";

export default function DailyCalendar({ selectedDate, onSelectDate, availableDates, todayDate }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const rootRef = useRef(null);

  const available = useMemo(() => new Set(availableDates), [availableDates]);
  const anchor = selectedDate || todayDate;

  useEffect(() => {
    if (anchor) setView(monthOf(anchor));
  }, [anchor, open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!anchor || availableDates.length === 0) return null;

  const previousDate = neighbourDate(availableDates, selectedDate || anchor, -1);
  const nextDate = neighbourDate(availableDates, selectedDate || anchor, 1);
  const isToday = selectedDate === todayDate;
  const sorted = [...availableDates].sort();
  const firstMonth = sorted[0].slice(0, 7);
  const lastMonth = (todayDate || sorted[sorted.length - 1]).slice(0, 7);
  const currentMonth = view ? monthKey(view) : firstMonth;

  const shiftMonth = (delta) => {
    const next = new Date(Date.UTC(view.year, view.month + delta, 1));
    setView({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  const choose = (date) => {
    setOpen(false);
    onSelectDate(date);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => previousDate && choose(previousDate)}
          disabled={!previousDate}
          aria-label="Previous day with questions"
          className={arrowClasses}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="glass-card px-4 py-2 flex items-center gap-3 font-mono text-white hover:border-matrix-200/40 transition-all"
        >
          <CalendarDays size={18} className="text-matrix-200" />
          <span>{selectedDate ? formatLong(selectedDate) : "Select a date"}</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border ${
              isToday
                ? "bg-matrix-200/15 text-matrix-200 border-matrix-200/30"
                : "bg-zinc-800 text-zinc-300 border-zinc-700"
            }`}
          >
            {isToday ? "Today" : "Past"}
          </span>
          <ChevronDown
            size={16}
            className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <button
          onClick={() => nextDate && choose(nextDate)}
          disabled={!nextDate}
          aria-label="Next day with questions"
          className={arrowClasses}
        >
          <ChevronRight size={18} />
        </button>

        {!isToday && todayDate && available.has(todayDate) && (
          <button
            onClick={() => choose(todayDate)}
            className="px-3 py-2 rounded-lg border border-matrix-200/30 text-matrix-200 hover:bg-matrix-200/10 font-mono text-sm transition-all"
          >
            Today
          </button>
        )}
      </div>

      {open && view && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute left-0 top-full mt-2 z-30 w-72 p-4 glass-card bg-zinc-950/95 shadow-2xl shadow-black/60"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={currentMonth <= firstMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-md text-zinc-300 hover:text-matrix-200 hover:bg-matrix-200/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-sm text-white">
              {new Date(Date.UTC(view.year, view.month, 1)).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              disabled={currentMonth >= lastMonth}
              aria-label="Next month"
              className="p-1.5 rounded-md text-zinc-300 hover:text-matrix-200 hover:bg-matrix-200/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day, index) => (
              <span key={index} className="text-[11px] font-mono text-zinc-500 py-1">
                {day}
              </span>
            ))}
            {buildMonthGrid(view.year, view.month).map((date, index) => {
              if (!date) return <span key={`blank-${index}`} />;
              const hasQuestions = available.has(date);
              const isSelected = date === selectedDate;
              const style = isSelected
                ? "bg-matrix-200 text-black font-bold"
                : hasQuestions
                  ? "bg-matrix-200/10 border border-matrix-200/30 text-white hover:bg-matrix-200/25"
                  : "text-zinc-600 cursor-default";
              return (
                <button
                  key={date}
                  disabled={!hasQuestions}
                  onClick={() => choose(date)}
                  aria-label={formatLong(date)}
                  aria-current={date === todayDate ? "date" : undefined}
                  className={`h-8 rounded-md text-xs font-mono transition-all ${style} ${
                    date === todayDate && !isSelected ? "ring-1 ring-matrix-200/60" : ""
                  }`}
                >
                  {Number(date.slice(8))}
                </button>
              );
            })}
          </div>

          <p className="mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-matrix-200/60" />
            Highlighted days have questions
          </p>
        </div>
      )}
    </div>
  );
}
