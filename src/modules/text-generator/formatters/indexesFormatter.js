export function indexesFormatter(files) {
  const lines = ["INDEXES", "======="];
  let hasData = false;
  for (const file of files) {
    const block = fmtIndexes(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtIndexes(file) {
  const indexes = file.indexes;
  if (!indexes?.length) return null;

  return indexes
    .map((ix) => {
      const cols = ix.columns.join(", ");
      let str = `${file.filePath}\n  ${ix.name} ON ${ix.table} (${cols})`;
      if (ix.type) str += ` ${ix.type}`;
      if (ix.using) str += ` USING ${ix.using}`;
      return str;
    })
    .join("\n");
}
