export function dropsFormatter(files) {
  const lines = ["DROPS", "====="];
  let hasData = false;
  for (const file of files) {
    const block = fmtDrops(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtDrops(file) {
  const drops = file.drops;
  if (!drops?.length) return null;

  return drops
    .map((d) => {
      const names = Array.isArray(d.name) ? d.name.join(", ") : d.name;
      return `${file.filePath}\n  ${d.keyword} ${names}`;
    })
    .join("\n");
}
