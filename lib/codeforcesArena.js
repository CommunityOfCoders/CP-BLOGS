import fs from "fs";
import { fetchProblemset, callCodeforces } from "./daily/codeforces.mjs";
import { fetchAcceptedSubmissions } from "./daily/submissions.mjs";
import { usedProblemIds } from "./daily/schedule.mjs";

/**
 * Fetches the set of problem keys (e.g. "1899A") solved with verdict "OK" by a user.
 * Backed by Vihaan's retry-enabled fetchAcceptedSubmissions.
 *
 * @param {string} handle - Codeforces username
 * @returns {Promise<Set<string>>}
 */
export async function getSolvedProblems(handle) {
  if (!handle) return new Set();
  try {
    const subs = await fetchAcceptedSubmissions(handle);
    return new Set(subs.map((s) => s.id));
  } catch (error) {
    console.error(`[Arena] Failed to fetch solved problems for ${handle}:`, error.message);
    return new Set();
  }
}

/**
 * Calculates the union of overlapping solved problems between both players
 * plus problems already used in daily history, ensuring Battle Arena selects
 * completely unique, unseen problems.
 *
 * @param {string} p1 - Player 1 CF handle
 * @param {string} p2 - Player 2 CF handle
 * @param {Object} [options]
 * @param {boolean} [options.excludeDaily=true] - Whether to exclude Daily Question history
 * @returns {Promise<Set<string>>}
 */
export async function getOverlappingExcludedProblems(p1, p2, { excludeDaily = true } = {}) {
  const [p1Subs, p2Subs] = await Promise.all([
    p1 ? fetchAcceptedSubmissions(p1).catch(() => []) : Promise.resolve([]),
    p2 ? fetchAcceptedSubmissions(p2).catch(() => []) : Promise.resolve([]),
  ]);

  const excluded = new Set();
  p1Subs.forEach((s) => excluded.add(s.id));
  p2Subs.forEach((s) => excluded.add(s.id));

  if (excludeDaily) {
    try {
      const historyPath = new URL("../json/daily/history.json", import.meta.url);
      if (fs.existsSync(historyPath)) {
        const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
        usedProblemIds(history).forEach((id) => excluded.add(id));
      }
    } catch {
      // Fallback silently if daily history file is empty or missing
    }
  }

  return excluded;
}

/**
 * Fetches Codeforces problemset and filters for unsolved problems in rating range & tag.
 * Automatically distributes problems in ascending rating buckets (e.g., 800-1100, 1100-1400, etc.)
 *
 * @param {Object} options
 * @param {string} options.p1 - Player 1 CF handle
 * @param {string} options.p2 - Player 2 CF handle
 * @param {number} options.minRating - Minimum problem rating (e.g. 800)
 * @param {number} options.maxRating - Maximum problem rating (e.g. 2000)
 * @param {string} [options.tag] - Optional tag (e.g. "dp", "greedy", "math")
 * @param {number} [options.count=3] - Number of problems to select
 * @returns {Promise<Array<{ id: string, contestId: number, index: string, name: string, rating: number, tags: string[], url: string }>>}
 */
export async function getRandomProblems({
  p1,
  p2,
  minRating = 800,
  maxRating = 2000,
  tag = "",
  count = 3,
}) {
  // 1. Fetch overlapping solved problems (P1 + P2 + Daily Questions)
  const excludedIds = await getOverlappingExcludedProblems(p1, p2);

  // 2. Fetch problems from Codeforces API using Vihaan's retry-backed fetchProblemset
  const allProblems = await fetchProblemset();

  // 3. Filter for eligible problems:
  // - Rating within [minRating, maxRating]
  // - Matches tag (if provided)
  // - Not solved by P1 or P2, and not used in daily questions
  const eligibleProblems = allProblems.filter((p) => {
    if (!Number.isInteger(p.rating) || p.rating < minRating || p.rating > maxRating) {
      return false;
    }

    if (tag && tag !== "all" && !p.tags.includes(tag)) {
      return false;
    }

    if (excludedIds.has(p.id)) {
      return false;
    }

    return true;
  });

  if (eligibleProblems.length < count) {
    throw new Error(
      `Only found ${eligibleProblems.length} eligible problem(s) matching rating [${minRating}-${maxRating}] and tag "${tag || 'all'}". Need at least ${count}. Try widening the rating range.`
    );
  }

  // 4. Stepped Rating Progression (Bucketing)
  // Divides [minRating, maxRating] into `count` buckets for ascending difficulty
  const step = (maxRating - minRating) / count;
  const pickedProblems = [];
  const pickedIds = new Set();

  for (let i = 0; i < count; i++) {
    const bucketMin = Math.round(minRating + i * step);
    const bucketMax = Math.round(minRating + (i + 1) * step);

    // Candidates in this rating bucket that haven't been picked yet
    let bucketCandidates = eligibleProblems.filter((p) => {
      return !pickedIds.has(p.id) && p.rating >= bucketMin && p.rating <= bucketMax;
    });

    // If bucket is too narrow or empty, widen search slightly (+/- 100 rating)
    if (bucketCandidates.length === 0) {
      bucketCandidates = eligibleProblems.filter((p) => {
        return (
          !pickedIds.has(p.id) &&
          p.rating >= Math.max(minRating, bucketMin - 100) &&
          p.rating <= Math.min(maxRating, bucketMax + 100)
        );
      });
    }

    // Fallback: pick any remaining unpicked eligible problem
    if (bucketCandidates.length === 0) {
      bucketCandidates = eligibleProblems.filter((p) => {
        return !pickedIds.has(p.id);
      });
    }

    if (bucketCandidates.length > 0) {
      const randomIdx = Math.floor(Math.random() * bucketCandidates.length);
      const chosen = bucketCandidates[randomIdx];
      pickedIds.add(chosen.id);
      pickedProblems.push(chosen);
    }
  }

  // Sort picked problems ascending by rating for a natural contest progression
  pickedProblems.sort((a, b) => (a.rating || 0) - (b.rating || 0));

  const selected = pickedProblems.map((p) => {
    // Extract contestId and index from id (e.g., '1899A' -> contestId: 1899, index: 'A')
    const match = p.id.match(/^(\d+)(.+)$/);
    const contestId = match ? parseInt(match[1], 10) : null;
    const index = match ? match[2] : "";

    return {
      id: p.id,
      contestId,
      index,
      name: p.name,
      rating: p.rating,
      tags: p.tags || [],
      url: p.url,
    };
  });

  return selected;
}

/**
 * Checks recent submissions of a player to determine which match problems were solved
 * within the match time window.
 * Backed by Vihaan's retry-backed callCodeforces API.
 *
 * @param {string} handle - Player's Codeforces handle
 * @param {Array<{ id: string, contestId: number, index: string }>} problems - Problems in the match
 * @param {number} startTime - Match start time in epoch seconds
 * @param {number} endTime - Match end time in epoch seconds
 * @returns {Promise<Object>} Map of problemId -> { solved: boolean, solvedAt?: number, timeTakenMinutes?: number, submissionId?: number }
 */
export async function verifyUserSubmissions(handle, problems, startTime, endTime) {
  if (!handle) return {};

  try {
    // Fetch last 30 submissions using Vihaan's retry-backed callCodeforces
    const rawSubmissions = await callCodeforces("user.status", {
      handle,
      from: 1,
      count: 30,
    });

    const submissions = Array.isArray(rawSubmissions) ? rawSubmissions : [];
    const results = {};

    problems.forEach((p) => {
      // Find submission for this specific problem that was Accepted (OK) during the match
      const matchingSub = submissions.find((sub) => {
        const pKey = `${sub.problem?.contestId}${sub.problem?.index}`;
        const isThisProblem = pKey === p.id;
        const isOK = sub.verdict === "OK";
        const isWithinWindow =
          sub.creationTimeSeconds >= startTime && sub.creationTimeSeconds <= endTime;

        return isThisProblem && isOK && isWithinWindow;
      });

      if (matchingSub) {
        results[p.id] = {
          solved: true,
          solvedAt: matchingSub.creationTimeSeconds,
          timeTakenMinutes: Math.max(0, Math.floor((matchingSub.creationTimeSeconds - startTime) / 60)),
          submissionId: matchingSub.id,
        };
      } else {
        results[p.id] = {
          solved: false,
        };
      }
    });

    return results;
  } catch (error) {
    console.error(`[Arena] Failed to verify submissions for ${handle}:`, error.message);
    // Return all unsolved on failure to fail gracefully
    const fallback = {};
    problems.forEach((p) => {
      fallback[p.id] = { solved: false, error: "CF API check failed" };
    });
    return fallback;
  }
}
