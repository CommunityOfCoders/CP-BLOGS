export const DAILY_CONFIG = {
  timezone: "Asia/Kolkata",
  historyDays: 365,
  minSolvedCount: 1000,
  excludedTags: ["*special"],
  stats: {
    minSolvesForStreak: 1,
    lateSolvesCount: false,
    submissionCount: 200,
    backfillSubmissionCount: 1000,
    requestGapMs: 2000,
    failureThreshold: 0.5,
  },
  slots: [
    { min: 800, max: 1000 },
    { min: 1000, max: 1200 },
    { min: 1200, max: 1400 },
    { min: 1400, max: 1600 },
    { min: 1600, max: 1800 },
    { min: 1800, max: 2000 },
  ],
};
