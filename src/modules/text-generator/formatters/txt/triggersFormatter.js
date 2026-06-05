export function triggersFormatter(files) {
  const lines = ["TRIGGERS", "========"];
  let hasData = false;
  for (const file of files) {
    const block = fmtTriggers(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtTriggers(file) {
  const triggers = file.triggers;
  if (!triggers?.length) return null;

  return triggers
    .map((t) => `${file.filePath}\n  ${t.name} (${t.timing} ${t.event} ON ${t.table})`)
    .join("\n");
}
