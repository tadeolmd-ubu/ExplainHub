export function tablesFormatter(files) {
  const lines = ["TABLES", "======"];
  let hasData = false;
  for (const file of files) {
    const block = fmtTables(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtTables(file) {
  const tables = file.tables;
  if (!tables?.length) return null;

  return tables
    .map((t) => {
      const cols = t.columns
        .map((c) => {
          let str = `  ${c.name} ${c.type}`;
          if (c.length) str += `(${c.length})`;
          if (c.primary) str += " PK";
          if (c.autoIncrement) str += " AUTO_INCREMENT";
          if (!c.nullable) str += " NOT NULL";
          if (c.default) str += ` DEFAULT ${c.default.value || c.default}`;
          if (c.unique) str += " UNIQUE";
          if (c.comment) str += ` -- ${c.comment}`;
          return str;
        })
        .join("\n");

      const fks = t.foreignKeys.length
        ? "\n" + t.foreignKeys
            .map(
              (fk) =>
                `  FK ${fk.constraint || ""}: ${fk.definition.join(", ")} → ${fk.reference.table}(${fk.reference.columns.join(", ")})${fk.reference.onDelete ? ` ON DELETE ${fk.reference.onDelete}` : ""}${fk.reference.onUpdate ? ` ON UPDATE ${fk.reference.onUpdate}` : ""}`,
            )
            .join("\n")
        : "";

      const extras = [];
      if (t.primaryKey.length)
        extras.push(`PK: ${t.primaryKey.map((p) => p.definition.join(", ")).join("; ")}`);
      if (t.uniqueConstraints.length)
        extras.push(`UNIQUE: ${t.uniqueConstraints.map((u) => u.definition.join(", ")).join("; ")}`);
      if (t.check.length)
        extras.push(`CHECK: ${t.check.map((c) => c.definition.join(", ")).join("; ")}`);
      if (t.indexes.length)
        extras.push(
          `INDEXES: ${t.indexes.map((ix) => `${ix.name || ""} (${ix.definition.join(", ")})${ix.type ? ` ${ix.type}` : ""}${ix.indexType ? ` ${ix.indexType}` : ""}`).join("; ")}`,
        );
      const extraStr = extras.length ? `\n  [${extras.join(" | ")}]` : "";

      return `${file.filePath}\n  ${t.name}${t.ifNotExists ? " IF NOT EXISTS" : ""}\n${cols}${fks}${extraStr}`;
    })
    .join("\n\n");
}
