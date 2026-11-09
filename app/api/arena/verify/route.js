import { NextResponse } from "next/server";
import { verifyMatchToken } from "@/lib/arenaToken";
import { verifyUserSubmissions } from "@/lib/codeforcesArena";

/**
 * Helper to process verification given a match token.
 */
async function processVerification(token) {
  if (!token) {
    return {
      status: 400,
      body: { success: false, error: "Missing match token." },
    };
  }

  const match = verifyMatchToken(token);
  if (!match) {
    return {
      status: 400,
      body: { success: false, error: "Invalid or tampered match token." },
    };
  }

  // Authoritative server UTC timestamp
  const now = Math.floor(Date.now() / 1000);
  const totalProblems = match.problems.length;

  // Case 1: Match is scheduled and hasn't started yet (Pending)
  if (now < match.startTime) {
    const startsInSeconds = match.startTime - now;

    // Mask problems so players cannot view the URLs in DevTools Network tab before startTime
    const maskedProblems = match.problems.map((p, idx) => ({
      problemId: `Problem ${String.fromCharCode(65 + idx)}`,
      name: `Classified Problem #${idx + 1}`,
      rating: p.rating,
      url: null,
      locked: true,
      [match.p1]: { solved: false },
      [match.p2]: { solved: false },
      firstSolver: null,
    }));

    return {
      status: 200,
      body: {
        success: true,
        isPending: true,
        startsInSeconds,
        now,
        match: {
          p1: match.p1,
          p2: match.p2,
          startTime: match.startTime,
          endTime: match.endTime,
          durationMinutes: match.durationMinutes,
          totalProblems,
        },
        timeRemainingSeconds: match.endTime - match.startTime,
        isFinished: false,
        outcome: "scheduled",
        winner: null,
        scoreboard: {
          [match.p1]: { score: 0, solvedCount: 0, totalTimeSeconds: 0 },
          [match.p2]: { score: 0, solvedCount: 0, totalTimeSeconds: 0 },
        },
        problems: maskedProblems,
      },
    };
  }

  // Case 2: Match is active or finished
  const isFinishedByTime = now >= match.endTime;

  // Verify recent Codeforces submissions for both handles in parallel
  const [p1Results, p2Results] = await Promise.all([
    verifyUserSubmissions(match.p1, match.problems, match.startTime, match.endTime),
    verifyUserSubmissions(match.p2, match.problems, match.startTime, match.endTime),
  ]);

  let p1Score = 0;
  let p2Score = 0;
  let p1TotalTimeSeconds = 0;
  let p2TotalTimeSeconds = 0;
  let p1SolvedCount = 0;
  let p2SolvedCount = 0;

  const problemStatusList = match.problems.map((p) => {
    const s1 = p1Results[p.id] || { solved: false };
    const s2 = p2Results[p.id] || { solved: false };

    let firstSolver = null;

    if (s1.solved) {
      p1Score += 1.0;
      p1SolvedCount += 1;
      p1TotalTimeSeconds += (s1.solvedAt - match.startTime);
    }

    if (s2.solved) {
      p2Score += 1.0;
      p2SolvedCount += 1;
      p2TotalTimeSeconds += (s2.solvedAt - match.startTime);
    }

    // First solve bonus (+0.5 points to faster solver)
    if (s1.solved && s2.solved) {
      if (s1.solvedAt < s2.solvedAt) {
        firstSolver = match.p1;
        p1Score += 0.5;
      } else if (s2.solvedAt < s1.solvedAt) {
        firstSolver = match.p2;
        p2Score += 0.5;
      }
    } else if (s1.solved && !s2.solved) {
      firstSolver = match.p1;
      p1Score += 0.5;
    } else if (s2.solved && !s1.solved) {
      firstSolver = match.p2;
      p2Score += 0.5;
    }

    return {
      problemId: p.id,
      name: p.name,
      rating: p.rating,
      url: p.url,
      locked: false,
      [match.p1]: s1,
      [match.p2]: s2,
      firstSolver,
    };
  });

  const bothCompletedAll = p1SolvedCount === totalProblems && p2SolvedCount === totalProblems;
  const isFinished = isFinishedByTime || bothCompletedAll;

  let winner = null;
  let outcome = "in_progress"; // "in_progress" | "winner" | "tie"

  if (isFinished) {
    if (p1Score > p2Score) {
      winner = match.p1;
      outcome = "winner";
    } else if (p2Score > p1Score) {
      winner = match.p2;
      outcome = "winner";
    } else {
      // Tie-break by lowest total time taken
      if (p1TotalTimeSeconds < p2TotalTimeSeconds) {
        winner = match.p1;
        outcome = "winner";
      } else if (p2TotalTimeSeconds < p1TotalTimeSeconds) {
        winner = match.p2;
        outcome = "winner";
      } else {
        winner = "Tie";
        outcome = "tie";
      }
    }
  }

  const timeRemainingSeconds = Math.max(0, match.endTime - now);

  return {
    status: 200,
    body: {
      success: true,
      isPending: false,
      match: {
        p1: match.p1,
        p2: match.p2,
        startTime: match.startTime,
        endTime: match.endTime,
        durationMinutes: match.durationMinutes,
        totalProblems,
      },
      now,
      timeRemainingSeconds,
      isFinished,
      outcome,
      winner,
      scoreboard: {
        [match.p1]: {
          score: p1Score,
          solvedCount: p1SolvedCount,
          totalTimeSeconds: p1TotalTimeSeconds,
        },
        [match.p2]: {
          score: p2Score,
          solvedCount: p2SolvedCount,
          totalTimeSeconds: p2TotalTimeSeconds,
        },
      },
      problems: problemStatusList,
    },
  };
}

/**
 * GET /api/arena/verify?token=...
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const { status, body } = await processVerification(token);
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("[Arena Verify GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify match status." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/arena/verify
 * Body: { token: string }
 */
export async function POST(req) {
  try {
    const json = await req.json();
    const { status, body } = await processVerification(json.token);
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("[Arena Verify POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify match status." },
      { status: 500 }
    );
  }
}
