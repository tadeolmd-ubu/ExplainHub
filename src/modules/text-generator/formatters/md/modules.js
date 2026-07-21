import path from "node:path";

export function moduleFormatter({ name, files }) {
  const sections = [
    `# Module: ${name}\n`,
    `**Location:** \`${getCommonPath(files)}\`\n`,
    fileStructureSection(files),
    functionsSection(files),
    classesSection(files),
    exportsSection(files),
    routesSection(files),
    sqlSection(files),
  ].filter(Boolean);

  return sections.join("\n\n");
}

function getCommonPath(files) {
  const dirs = files.map((f) => path.dirname(f.filePath));
  const first = dirs[0];
  if (!first) return "";
  return first;
}

function fileStructureSection(files) {
  const rows = files.map(
    (f) => `| \`${path.basename(f.filePath)}\` | ${getFileTypeDesc(f.type)} |`,
  );
  return `## File Structure\n\n| File | Purpose |\n|------|---------|\n${rows.join("\n")}`;
}

const FILES_TYPES = {
  javascript: "JavaScript module",
  typescript: "TypeScript module",
  markup: "HTML template",
  stylesheet: "CSS styles",
  sql: "SQL script",
  python: "Python module",
  php: "PHP module",
  csharp: "C# module",
  sln: "Solution file",
  csproj: "C# project file",
  config: "Configuration file",
  xaml: "XAML view",
  rust: "Rust module",
  java: "Java module",
  go: "Go module",
  c: "C source file",
  cpp: "C++ source file",
  ruby: "Ruby script/module",
  ini: "INI configuration",
  powershell: "PowerShell script/module",
};

function getFileTypeDesc(type) {
  return FILES_TYPES[type] || type;
}

function functionsSection(files) {
  const funcs = files.flatMap((f) =>
    (f.functions || []).map((fn) => ({
      ...fn,
      file: path.basename(f.filePath),
    })),
  );
  if (funcs.length === 0) return null;
  const rows = funcs.map(
    (fn) =>
      `| ${fn.name} | ${fn.kind} | ${fn.async ? "yes" : ""} | \`${fn.file}\` |`,
  );
  return `## Functions\n\n| Name | Kind | Async | File |\n|------|------|-------|------|\n${rows.join("\n")}`;
}

function classesSection(files) {
  const classes = files.flatMap((f) =>
    (f.classes || []).map((c) => ({ ...c, file: path.basename(f.filePath) })),
  );
  if (classes.length === 0) return null;
  const rows = classes.map(
    (c) => `| ${c.name} | ${c.extends || "-"} | \`${c.file}\` |`,
  );
  return `## Classes\n\n| Name | Extends | File |\n|------|---------|------|\n${rows.join("\n")}`;
}

function exportsSection(files) {
  const exports = files.flatMap((f) =>
    (f.exports || []).map((e) => ({ ...e, file: path.basename(f.filePath) })),
  );
  if (exports.length === 0) return null;
  const rows = exports.map((e) => `| ${e.name} | ${e.kind} | \`${e.file}\` |`);
  return `## Exports\n\n| Name | Kind | File |\n|------|------|------|\n${rows.join("\n")}`;
}

function routesSection(files) {
  const routes = files.flatMap((f) =>
    (f.routes || []).map((r) => ({ ...r, file: path.basename(f.filePath) })),
  );
  if (routes.length === 0) return null;
  const rows = routes.map((r) => `| ${r.method} | ${r.path} | \`${r.file}\` |`);
  return `## Routes\n\n| Method | Path | File |\n|--------|------|------|\n${rows.join("\n")}`;
}

function sqlSection(files) {
  const parts = [];
  for (const f of files) {
    if (f.tables?.length) {
      parts.push(
        `### Tables\n\n| Table | Columns |\n|-------|---------|\n${f.tables.map((t) => `| ${t.name} | ${(t.columns || []).map((c) => c.name).join(", ")} |`).join("\n")}`,
      );
    }
    if (f.views?.length) {
      parts.push(
        `### Views\n\n${f.views.map((v) => `- ${v.name}`).join("\n")}`,
      );
    }
    if (f.indexes?.length) {
      parts.push(
        `### Indexes\n\n${f.indexes.map((i) => `- ${i.name} ON ${i.table}(${(i.columns || []).join(", ")})`).join("\n")}`,
      );
    }
  }
  if (parts.length === 0) return null;
  return `## SQL Objects\n\n${parts.join("\n\n")}`;
}
