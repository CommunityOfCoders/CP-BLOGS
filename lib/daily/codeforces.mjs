const API_BASE = "https://codeforces.com/api";

export function problemId(contestId, index) {
  return `${contestId}${index}`;
}

export function problemUrl(contestId, index) {
  return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
}

export function normalizeProblemset(result) {
  if (!result || !Array.isArray(result.problems) || !Array.isArray(result.problemStatistics)) {
    throw new Error("Unexpected Codeforces response shape");
  }

  const solvedCounts = new Map(
    result.problemStatistics.map((stat) => [problemId(stat.contestId, stat.index), stat.solvedCount])
  );

  return result.problems
    .filter((problem) => Number.isInteger(problem.rating))
    .map((problem) => {
      const id = problemId(problem.contestId, problem.index);
      return {
        id,
        name: problem.name,
        rating: problem.rating,
        tags: problem.tags ?? [],
        solvedCount: solvedCounts.get(id) ?? 0,
        url: problemUrl(problem.contestId, problem.index),
      };
    });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce(method, params, fetchImpl) {
  const query = new URLSearchParams(params).toString();
  const response = await fetchImpl(`${API_BASE}/${method}?${query}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`Codeforces responded with HTTP ${response.status}`);
  }
  const body = await response.json();
  if (body.status !== "OK") {
    const error = new Error(`Codeforces API error: ${body.comment ?? "unknown"}`);
    error.permanent = /not found/i.test(body.comment ?? "");
    throw error;
  }
  return body.result;
}

export async function callCodeforces(
  method,
  params = {},
  { fetchImpl = fetch, attempts = 3, retryDelayMs = 5000 } = {}
) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await requestOnce(method, params, fetchImpl);
    } catch (error) {
      lastError = error;
      console.error(
        `[daily] Codeforces ${method} failed (attempt ${attempt}/${attempts}): ${error.message}`
      );
      if (error.permanent) break;
      if (attempt < attempts) {
        await sleep(retryDelayMs * attempt);
      }
    }
  }
  const failure = new Error(`Codeforces ${method} failed: ${lastError.message}`);
  failure.permanent = Boolean(lastError.permanent);
  throw failure;
}

export async function fetchProblemset(options) {
  return normalizeProblemset(await callCodeforces("problemset.problems", {}, options));
}
