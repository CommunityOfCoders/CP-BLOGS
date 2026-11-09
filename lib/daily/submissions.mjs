import { callCodeforces, problemId } from "./codeforces.mjs";

export function normalizeSubmissions(result) {
  if (!Array.isArray(result)) {
    throw new Error("Unexpected Codeforces submissions response shape");
  }
  return result
    .filter(
      (submission) =>
        submission.verdict === "OK" &&
        Number.isInteger(submission.problem?.contestId) &&
        Number.isInteger(submission.creationTimeSeconds)
    )
    .map((submission) => ({
      id: problemId(submission.problem.contestId, submission.problem.index),
      at: submission.creationTimeSeconds,
    }));
}

export async function fetchAcceptedSubmissions(handle, { count, ...options } = {}) {
  const result = await callCodeforces("user.status", { handle, from: 1, count }, options);
  return normalizeSubmissions(result);
}
