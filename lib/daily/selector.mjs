export function validateSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new Error("Daily config needs at least one slot");
  }
  slots.forEach((slot, index) => {
    const valid = Number.isInteger(slot.min) && Number.isInteger(slot.max) && slot.min <= slot.max;
    if (!valid) {
      throw new Error(`Invalid rating range for question ${index + 1}: ${JSON.stringify(slot)}`);
    }
  });
}

export function eligibleProblems(problems, { minSolvedCount = 0, excludedTags = [] } = {}) {
  return problems.filter(
    (problem) =>
      problem.solvedCount >= minSolvedCount &&
      !problem.tags.some((tag) => excludedTags.includes(tag))
  );
}

export function createRandom(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDailyProblems({ problems, slots, date, excludeIds = [], seed = date }) {
  validateSlots(slots);
  const random = createRandom(seed);
  const avoid = new Set(excludeIds);
  const usedToday = new Set();

  return slots.map((slot, index) => {
    const inRange = problems.filter(
      (problem) =>
        problem.rating >= slot.min && problem.rating <= slot.max && !usedToday.has(problem.id)
    );
    const unseen = inRange.filter((problem) => !avoid.has(problem.id));
    const pool = unseen.length > 0 ? unseen : inRange;

    if (pool.length === 0) {
      throw new Error(`No problem available for question ${index + 1} (${slot.min}-${slot.max})`);
    }

    const chosen = pool[Math.floor(random() * pool.length)];
    usedToday.add(chosen.id);

    return {
      slot: index + 1,
      id: chosen.id,
      name: chosen.name,
      rating: chosen.rating,
      tags: chosen.tags,
      url: chosen.url,
    };
  });
}
