import { NextResponse } from "next/server";
import history from "@/json/daily/history.json";
import { DAILY_CONFIG } from "@/lib/daily/config.mjs";
import {
  DATE_PATTERN,
  dateInZone,
  findEntry,
  listDates,
  publishedHistory,
  resolveEntry,
} from "@/lib/daily/schedule.mjs";

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };

export async function GET(req) {
  const requestedDate = new URL(req.url).searchParams.get("date");
  const today = dateInZone(DAILY_CONFIG.timezone);
  const published = publishedHistory(history, today);
  const context = { today, availableDates: listDates(published) };

  const fail = (error, status) => NextResponse.json({ error, ...context }, { status });
  const succeed = (entry, stale) =>
    NextResponse.json(
      {
        date: entry.date,
        stale,
        timezone: DAILY_CONFIG.timezone,
        count: entry.problems.length,
        problems: entry.problems,
        ...context,
      },
      { status: 200, headers: CACHE_HEADERS }
    );

  if (requestedDate) {
    if (!DATE_PATTERN.test(requestedDate)) {
      return fail("Invalid date, expected YYYY-MM-DD", 400);
    }
    const entry = findEntry(published, requestedDate);
    return entry ? succeed(entry, false) : fail(`No questions found for ${requestedDate}`, 404);
  }

  const { entry, stale } = resolveEntry(published, today);
  return entry ? succeed(entry, stale) : fail("Daily questions have not been generated yet", 503);
}
