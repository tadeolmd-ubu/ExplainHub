const METADATA_KEYS = new Set([
  "filePath", "type", "package", "dependencies", "features",
]);

function isEmptyFile(file) {
  return Object.keys(file)
    .filter((key) => !METADATA_KEYS.has(key))
    .every((key) => {
      const val = file[key];
      return !val || (Array.isArray(val) && val.length === 0);
    });
}

export function fileFormatter(file) {
  if (isEmptyFile(file)) {
     return `-- ${file.filePath} (${file.type}) --\nPendiente de implementar`;
  }
  const {
    filePath, type, imports, exports, functions, classes, routes,
    tables, views, indexes, storedProcedures, triggers, databases,
    inserts, updates, deletes, selects, alterTables, drops, comments,
  } = file;

  const lines = [
    `-- ${filePath} (${type}) --`,
    fmtLabel("Imports", fmtImports(imports)),
    fmtLabel("Exports", fmtExports(exports)),
    fmtLabel("Functions", fmtFunctions(functions)),
    fmtLabel("Classes", fmtClasses(classes)),
    fmtLabel("Routes", fmtRoutes(routes)),
    fmtLabel("Tables", fmtTables(tables)),
    fmtLabel("Views", fmtViews(views)),
    fmtLabel("Indexes", fmtIndexes(indexes)),
    fmtLabel("Procedures", fmtProcedures(storedProcedures)),
    fmtLabel("Triggers", fmtTriggers(triggers)),
    fmtLabel("Databases", fmtDatabases(databases)),
    fmtLabel("Inserts", fmtInserts(inserts)),
    fmtLabel("Updates", fmtUpdates(updates)),
    fmtLabel("Deletes", fmtDeletes(deletes)),
    fmtLabel("Selects", fmtSelects(selects)),
    fmtLabel("Alter Tables", fmtAlterTables(alterTables)),
    fmtLabel("Drops", fmtDrops(drops)),
    fmtLabel("Comments", fmtComments(comments)),
  ].filter(Boolean);
  return lines.join("\n");
}

function fmtLabel(label, value) {
  if (!value) return "";
  return `${label}: ${value}`;
}

function fmtRoutes(routes) {
  if (!routes?.length) return "";
  return routes.map((r) => `${r.method} ${r.path}`).join(", ");
}

function fmtImports(imports) {
  if (!imports?.length) return "";
  return imports.map((i) => i.source).join(", ");
}

function fmtExports(exports) {
  if (!exports?.length) return "";
  return exports.map((e) => `${e.name} (${e.kind})`).join(", ");
}

function fmtClasses(classes) {
  if (!classes?.length) return "";
  return classes
    .map((c) => {
      if (c.extends) return `${c.name} extends ${c.extends}`;
      return c.name;
    })
    .join(", ");
}

function fmtFunctions(functions) {
  if (!functions?.length) return "";
  return functions
    .map((f) => {
      let str = `${f.name} (${f.kind})`;
      if (f.async) str += " async";
      return str;
    })
    .join(", ");
}

function fmtTables(tables) {
  if (!tables?.length) return "";
  return tables
    .map((t) => {
      const cols = t.columns.map((c) => c.name).join(", ");
      const fks = t.foreignKeys.length
        ? ` FK: [${t.foreignKeys.map((fk) => `${fk.definition.join(",")} → ${fk.reference.table}(${fk.reference.columns.join(",")})`).join("; ")}]`
        : "";
      return `${t.name}(${cols})${fks}`;
    })
    .join("; ");
}

function fmtViews(views) {
  if (!views?.length) return "";
  return views.map((v) => v.name).join(", ");
}

function fmtIndexes(indexes) {
  if (!indexes?.length) return "";
  return indexes
    .map((i) => `${i.name} ON ${i.table}(${i.columns.join(", ")})`)
    .join("; ");
}

function fmtProcedures(procedures) {
  if (!procedures?.length) return "";
  return procedures
    .map((p) => {
      const params = p.params.map((pm) => `${pm.mode} ${pm.name} ${pm.type}`).join(", ");
      return `${p.name}(${params})`;
    })
    .join("; ");
}

function fmtTriggers(triggers) {
  if (!triggers?.length) return "";
  return triggers
    .map((t) => `${t.name} (${t.timing} ${t.event} ON ${t.table})`)
    .join("; ");
}

function fmtDatabases(databases) {
  if (!databases?.length) return "";
  return databases.map((d) => d.name).join(", ");
}

function fmtInserts(inserts) {
  if (!inserts?.length) return "";
  return inserts
    .map((i) => {
      const cols = i.columns ? `(${i.columns.join(", ")})` : "";
      return `INTO ${i.table}${cols}`;
    })
    .join("; ");
}

function fmtUpdates(updates) {
  if (!updates?.length) return "";
  return updates
    .map((u) => {
      const sets = u.set.map((s) => `${s.column} = ${s.value?.value || "?"}`).join(", ");
      return `UPDATE ${u.table} SET ${sets}`;
    })
    .join("; ");
}

function fmtDeletes(deletes) {
  if (!deletes?.length) return "";
  return deletes.map((d) => `FROM ${d.from.join(", ")}`).join("; ");
}

function fmtSelects(selects) {
  if (!selects?.length) return "";
  return selects
    .map((s) => {
      const cols = s.columns?.map((c) => c.alias ? `${c.column} AS ${c.alias}` : c.column).join(", ") || "*";
      const from = s.from?.join(", ") || "";
      return `SELECT ${cols} FROM ${from}`;
    })
    .join("; ");
}

function fmtAlterTables(alters) {
  if (!alters?.length) return "";
  return alters
    .map((a) => {
      const ops = a.operations
        .map((op) => {
          let str = `${op.action} ${op.resource}`;
          if (op.column) str += ` ${op.column}`;
          if (op.constraint) str += ` ${op.constraint}`;
          if (op.newName) str += ` → ${op.newName}`;
          return str;
        })
        .join(", ");
      return `${a.table}: ${ops}`;
    })
    .join("; ");
}

function fmtDrops(drops) {
  if (!drops?.length) return "";
  return drops
    .map((d) => {
      const names = Array.isArray(d.name) ? d.name.join(", ") : d.name;
      return `${d.keyword} ${names}`;
    })
    .join("; ");
}

function fmtComments(comments) {
  if (!comments?.length) return "";
  return comments
    .map((c) => `L${c.line} ${c.type}: ${c.content}`)
    .join(" | ");
}
