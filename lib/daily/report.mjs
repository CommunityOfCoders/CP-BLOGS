const escapeCell = (text) => String(text).replace(/\|/g, "\\|").replace(/\s+/g, " ");

const escapeAnnotation = (text) =>
  String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

export function shouldFailRun(failureCount, total, threshold) {
  return total > 0 && failureCount / total >= threshold;
}

export function formatAnnotations(failures) {
  return failures.map(
    (failure) =>
      `::warning title=Daily stats::${escapeAnnotation(
        `${failure.key} (${failure.handle}): ${failure.reason}`
      )}`
  );
}

export function formatRunReport({ date, total, saved, changed, failures }) {
  const lines = [
    `### Daily stats for ${date}`,
    "",
    `Stats ${changed ? "updated" : "unchanged"}, ${saved} of ${total} members saved.`,
  ];

  if (failures.length > 0) {
    lines.push(
      "",
      `${failures.length} member(s) could not be checked this run:`,
      "",
      "| Member | Handle | Problem | Stats |",
      "|---|---|---|---|"
    );
    for (const failure of failures) {
      lines.push(
        `| ${escapeCell(failure.key)} | ${escapeCell(failure.handle)} | ${escapeCell(
          failure.invalid ? "Invalid handle" : failure.reason
        )} | ${failure.kept ? "previous kept" : "not saved"} |`
      );
    }
  }
  return `${lines.join("\n")}\n`;
}
