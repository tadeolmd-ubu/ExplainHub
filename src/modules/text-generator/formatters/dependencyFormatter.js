export function dependencyFormatter(files) {
  const lines = ["DEPENDENCY MAP", "============="];
  for (const file of files) {
    const block = fmtFileDeps(file);
    if (block) lines.push("", block);
  }
  return lines.join("\n");
}

function fmtFileDeps(file) {
  const sources = file.imports?.map((i) => i.source) || [];
  if (!sources.length) return null;
  return `${file.filePath}\n  imports: ${sources.join(", ")}`;
}
