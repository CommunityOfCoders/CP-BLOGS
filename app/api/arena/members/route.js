import { NextResponse } from "next/server";
import members from "@/json/members.json";

/**
 * GET /api/arena/members
 * Returns registered club members who have a valid Codeforces handle.
 */
export async function GET() {
  try {
    const list = Object.entries(members)
      .filter(([_, m]) => m.cf_username && m.cf_username.trim() !== "")
      .map(([id, m]) => ({
        id,
        name: m.name,
        year: m.year,
        cf_username: m.cf_username,
        inClub: !!m.inClub,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, count: list.length, members: list });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load club members" },
      { status: 500 }
    );
  }
}
