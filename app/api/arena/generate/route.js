import { NextResponse } from "next/server";
import { getRandomProblems } from "@/lib/codeforcesArena";
import { signMatchToken } from "@/lib/arenaToken";

/**
 * POST /api/arena/generate
 * Creates a new 1v1 Battle Arena match with optional scheduled start delay.
 *
 * Request Body:
 * {
 *   p1: string,                // Player 1 Codeforces handle
 *   p2: string,                // Player 2 Codeforces handle
 *   minRating?: number,        // Default: 800
 *   maxRating?: number,        // Default: 1600
 *   tag?: string,              // e.g. "dp", "greedy", "math" or ""
 *   count?: number,            // Default: 3
 *   durationMinutes?: number,  // Default: 45
 *   startDelaySeconds?: number // Default: 0 (or 30, 60, 120, etc.)
 * }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      p1,
      p2,
      minRating = 800,
      maxRating = 1600,
      tag = "",
      count = 3,
      durationMinutes = 45,
      startDelaySeconds = 0,
    } = body;

    // 1. Validation
    if (!p1 || typeof p1 !== "string" || !p1.trim()) {
      return NextResponse.json(
        { success: false, error: "Player 1 handle (p1) is required." },
        { status: 400 }
      );
    }
    if (!p2 || typeof p2 !== "string" || !p2.trim()) {
      return NextResponse.json(
        { success: false, error: "Player 2 handle (p2) is required." },
        { status: 400 }
      );
    }

    const cleanP1 = p1.trim();
    const cleanP2 = p2.trim();

    if (cleanP1.toLowerCase() === cleanP2.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Player 1 and Player 2 cannot be the same user." },
        { status: 400 }
      );
    }

    const numMinRating = Math.max(800, Number(minRating) || 800);
    const numMaxRating = Math.min(3500, Number(maxRating) || 1600);
    const numCount = Math.min(5, Math.max(1, Number(count) || 3));
    const numDuration = Math.min(180, Math.max(10, Number(durationMinutes) || 45));
    const numDelay = Math.max(0, Math.min(1800, Number(startDelaySeconds) || 0)); // max 30 min delay

    if (numMinRating > numMaxRating) {
      return NextResponse.json(
        { success: false, error: "minRating cannot be greater than maxRating." },
        { status: 400 }
      );
    }

    // 2. Fetch random problems unsolved by both users
    const problems = await getRandomProblems({
      p1: cleanP1,
      p2: cleanP2,
      minRating: numMinRating,
      maxRating: numMaxRating,
      tag: typeof tag === "string" ? tag.trim() : "",
      count: numCount,
    });

    // 3. Define match timeline with server UTC epoch seconds
    const nowUtc = Math.floor(Date.now() / 1000);
    const startTime = nowUtc + numDelay;
    const endTime = startTime + numDuration * 60;

    const matchPayload = {
      p1: cleanP1,
      p2: cleanP2,
      problems,
      startTime,
      endTime,
      durationMinutes: numDuration,
      startDelaySeconds: numDelay,
      tag: tag || "any",
      minRating: numMinRating,
      maxRating: numMaxRating,
    };

    // 4. Cryptographically sign the match state into a tamper-proof token
    const token = signMatchToken(matchPayload);

    return NextResponse.json({
      success: true,
      token,
      match: matchPayload,
    });
  } catch (error) {
    console.error("[Arena Generate Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate match problems.",
      },
      { status: 500 }
    );
  }
}
