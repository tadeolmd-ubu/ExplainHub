export function dmlFormatter(files) {
  const lines = ["DML STATEMENTS", "=============="];
  let hasData = false;
  for (const file of files) {
    const block = fmtDml(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtDml(file) {
  const parts = [];

  if (file.inserts?.length) {
    parts.push(
      "INSERT:",
      ...file.inserts.map((i) => {
        const cols = i.columns ? `(${i.columns.join(", ")})` : "";
        return `  INTO ${i.table}${cols}`;
      }),
    );
  }

  if (file.updates?.length) {
    parts.push(
      "UPDATE:",
      ...file.updates.map((u) => {
        const sets = u.set.map((s) => `${s.column} = ${s.value?.value || "?"}`).join(", ");
        return `  ${u.table} SET ${sets}`;
      }),
    );
  }

  if (file.deletes?.length) {
    parts.push(
      "DELETE:",
      ...file.deletes.map((d) => `  FROM ${d.from.join(", ")}`),
    );
  }

  if (file.selects?.length) {
    parts.push(
      "SELECT:",
      ...file.selects.map((s) => {
        const cols = s.columns?.map((c) => c.alias ? `${c.column} AS ${c.alias}` : c.column).join(", ") || "*";
        const from = s.from?.join(", ") || "";
        return `  SELECT ${cols} FROM ${from}`;
      }),
    );
  }

  if (!parts.length) return null;
  return `${file.filePath}\n  ${parts.join("\n  ")}`;
}
