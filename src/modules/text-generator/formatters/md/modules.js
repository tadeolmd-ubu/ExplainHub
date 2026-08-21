import path from "node:path";
import { isEmptyFile } from "../utils.js";

export function moduleFormatter({ name, files }) {
  const sections = [
    `# Module: ${name}\n`,
    moduleDescription(files),
    fileStructureSection(files),
    functionsSection(files),
    classesSection(files),
    exportsSection(files),
    routesSection(files),
    sqlSection(files),
  ].filter(Boolean);

  return sections.join("\n\n");
}

function moduleDescription(files) {
  const types = new Set(files.map((f) => f.type).filter(Boolean));
  const total = files.length;
  const parts = [];
  if (types.has("sql"))
    parts.push("SQL scripts and database objects");
  if (types.has("javascript") || types.has("typescript"))
    parts.push("JavaScript application logic");
  if (types.has("php")) parts.push("PHP application logic");
  if (types.has("python")) parts.push("Python application logic");
  if (types.has("ruby")) parts.push("Ruby application logic");
  if (types.has("stylesheet")) parts.push("CSS styles");
  if (types.has("markup")) parts.push("HTML templates");
  if (types.has("rust")) parts.push("Rust modules");
  if (types.has("java")) parts.push("Java modules");
  if (types.has("go")) parts.push("Go modules");
  if (types.has("csharp")) parts.push("C# modules");
  if (types.has("config")) parts.push("Configuration files");
  if (parts.length === 0) return null;
  return `This module contains ${parts.join(" and ")} (${total} file${total === 1 ? "" : "s"}).\n\n[Module description]`;
}

function getCommonPath(files) {
  const dirs = files.map((f) => path.dirname(f.filePath));
  const first = dirs[0];
  if (!first) return "";
  return first;
}

function fileStructureSection(files) {
  const rows = files.map((f) => {
    const purpose = isEmptyFile(f)
      ? "Pendiente de implementar"
      : getFileTypeDesc(f.type, f.filePath);
    return `| \`${path.basename(f.filePath)}\` | ${purpose} |`;
  });
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

function getFileTypeDesc(type, filePath) {
  const base = FILES_TYPES[type] || type;
  const name = path.basename(filePath).toLowerCase();

  if (type === "sql") {
    if (name.includes("schema") || name.includes("create") || name.includes("init"))
      return "Database schema initialization";
    if (name.includes("seed") || name.includes("data"))
      return "Seed data for initial population";
    if (name.includes("migrat"))
      return "Database migration script";
    if (name.includes("drop") || name.includes("delete") || name.includes("destroy"))
      return "Database cleanup script";
    if (name.includes("backup") || name.includes("export"))
      return "Database backup script";
    if (name.includes("view") || name.includes("v_"))
      return "Database view definition";
    if (name.includes("procedure") || name.includes("sp_") || name.includes("fn_"))
      return "Stored procedure definition";
    return "SQL script for database operations";
  }
  if (type === "javascript" || type === "typescript") {
    if (name.includes("config") || name.includes("settings"))
      return "Application configuration";
    if (name.includes("route") || name.includes("router"))
      return "Route definitions";
    if (name.includes("middleware"))
      return "Request middleware handlers";
    if (name.includes("controller"))
      return "Request handlers and business logic";
    if (name.includes("model") || name.includes("schema"))
      return "Data models and validation";
    if (name.includes("service"))
      return "Service layer business logic";
    if (name.includes("util") || name.includes("helper"))
      return "Utility functions and helpers";
    if (name.includes("test") || name.includes("spec"))
      return "Unit and integration tests";
    if (name.includes("index"))
      return "Module entry point";
    if (name.includes("server") || name.includes("app") || name.includes("main"))
      return "Application entry point";
    return base;
  }
  if (type === "php") {
    if (name.includes("config") || name.includes("settings"))
      return "Application configuration";
    if (name.includes("route") || name.includes("router"))
      return "Route definitions";
    if (name.includes("controller"))
      return "Request handlers and business logic";
    if (name.includes("model"))
      return "Data models and validation";
    if (name.includes("migration"))
      return "Database migration script";
    if (name.includes("middleware"))
      return "Request middleware handlers";
    if (name.includes("test") || name.includes("spec"))
      return "Unit and integration tests";
    if (
      name.includes("login") ||
      name.includes("logout") ||
      name.includes("auth") ||
      name.includes("register") ||
      name.includes("sesion") ||
      name.includes("session")
    )
      return "User authentication and session handling";
    if (name.includes("admin") || name.includes("panel"))
      return "Administration panel views and logic";
    if (name.includes("dashboard"))
      return "Main dashboard view";
    if (name.includes("conexion") || name.includes("connection") || name.includes("database") || name.includes("db"))
      return "Database connection handling";
    if (name.includes("inscripcion") || name.includes("enroll") || name.includes("inscription"))
      return "Membership enrollment form handling";
    if (name.includes("membresia") || name.includes("membership"))
      return "Membership management logic";
    return base;
  }
  if (type === "stylesheet") {
    if (name.includes("variables") || name.includes("tokens"))
      return "Design tokens and CSS variables";
    if (name.includes("reset") || name.includes("normalize"))
      return "CSS reset and normalization";
    if (name.includes("layout"))
      return "Layout and grid styles";
    if (name.includes("component") || name.includes("widget"))
      return "Component-specific styles";
    if (name.includes("responsive") || name.includes("media"))
      return "Responsive design breakpoints";
    return base;
  }
  return base;
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

  const cssVars = exports.filter((e) => e.kind === "css-variable");
  const otherExports = exports.filter((e) => e.kind !== "css-variable");

  const uniqueExports = [];
  const seen = new Set();
  for (const e of otherExports) {
    const key = `${e.name}|${e.kind}|${e.file}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueExports.push(e);
    }
  }
  const sections = [];
  if (uniqueExports.length > 0) {
    const rows = uniqueExports.map(
      (e) => `| ${e.name} | ${e.kind} | \`${e.file}\` |`,
    );
    sections.push(
      `## Exports\n\n| Name | Kind | File |\n|------|------|------|\n${rows.join("\n")}`,
    );
  }

  if (cssVars.length > 0) {
    const rows = cssVars.map((e) => `| --${e.name} | \`${e.file}\` |`);
    sections.push(
      `## CSS Variables\n\n| Variable | File |\n|----------|------|\n${rows.join("\n")}`,
    );
  }

  return sections.join("\n\n");
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
