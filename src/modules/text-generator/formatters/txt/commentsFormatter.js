export function commentsFormatter(files) {
  const lines = ["COMMENTS", "========"];
  let hasData = false;
  for (const file of files) {
    const block = fmtComments(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtComments(file) {
  const comments = file.comments;
  if (!comments?.length) return null;

  return comments
    .map((c) => `${file.filePath}:L${c.line} ${c.type}: ${c.content}`)
    .join("\n");
}
