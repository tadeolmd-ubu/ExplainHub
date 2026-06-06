export function alterFormatter(files) {
  const lines = ["ALTER MAP", "============="];
  let hasAlters = false;
  for (const file of files) {
    const block = fmtAlter(file);
    if (!block) continue;
    hasAlters = true;
    lines.push("", block);
  }
  if (!hasAlters) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtAlter(file) {
  const alters = file.alterTables;
  if (!alters?.length) return null;

  return alters
    .map((a) => {
      const ops = a.operations
        .map((op) => {
          let str = `${op.action} ${op.resource}`;
          if (op.name) str += ` ${op.name}`;
          if (op.newName) str += ` → ${op.newName}`;
          return str;
        })
        .join(", ");
      return `${file.filePath}\n  ${a.tableName}: ${ops}`;
    })
    .join("\n");
}
