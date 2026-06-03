export function viewsFormatter(files) {
  const lines = ["VIEWS", "====="];
  let hasData = false;
  for (const file of files) {
    const block = fmtViews(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtViews(file) {
  const views = file.views;
  if (!views?.length) return null;

  return views
    .map((v) => `${file.filePath}\n  ${v.name}`)
    .join("\n");
}
