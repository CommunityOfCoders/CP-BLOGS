import { NextResponse } from "next/server";
import stats from "@/json/daily/stats.json";
import { rankUsers } from "@/lib/daily/stats.mjs";

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };

function withoutRawSolves({ solves, lateSolves, ...user }) {
  return user;
}

export async function GET(req) {
  const url = new URL(req.url);
  const key = url.searchParams.get("user");
  const sortBy = url.searchParams.get("sort") || "streak";

  if (key) {
    const user = stats.users[key];
    if (!user) {
      return NextResponse.json({ error: `No stats found for ${key}` }, { status: 404 });
    }
    return NextResponse.json(
      { updatedAt: stats.updatedAt, key, ...user },
      { status: 200, headers: CACHE_HEADERS }
    );
  }

  const users = rankUsers(stats.users, sortBy).map(withoutRawSolves);
  return NextResponse.json(
    { updatedAt: stats.updatedAt, count: users.length, users },
    { status: 200, headers: CACHE_HEADERS }
  );
}
