import { Parser } from "node-sql-parser";
const parser = new Parser();

import { extractAlter } from "../extractors/alterExtractor.js";
import { extractComments } from "../extractors/commentExtractor.js";
import { extractOtherCreate } from "../extractors/createOtherExtractor.js";
import { extractCreateTable } from "../extractors/createTableExtractor.js";
import { extractDml } from "../extractors/dmlExtractor.js";
import { extractDrop } from "../extractors/dropExtractor.js";

const DIALECT_PATTERNS = [
  { pattern: /\[.*?\]/, name: "transactsql" },
  { pattern: /\bTOP\b/i, name: "transactsql" },
  { pattern: /\bIDENTITY\b/i, name: "transactsql" },
  { pattern: /\bOUTPUT\b/i, name: "transactsql" },
  { pattern: /\bGO\b/i, name: "transactsql" },
  { pattern: /`.*?`/, name: "mysql" },
  { pattern: /\bAUTO_INCREMENT\b/i, name: "mysql" },
  { pattern: /\bSERIAL\b/i, name: "postgresql" },
  { pattern: /\b::\b/, name: "postgresql" },
  { pattern: /\bRETURNS\s+TABLE\b/i, name: "postgresql" },
  { pattern: /\bDATABASE\b/i, name: "mysql" },
];

// ─── HELPER: PARTIR POR GO ────────────────────────────────
function splitBatches(sql) {
  return sql
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !/^\s*PRINT\b/i.test(b));
}

// ─── HELPER: FALLBACK POR REGEX ──────────────────────────
function extractFromRaw(sql) {
  const tables = [
    ...sql.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?|\[?)(\w+)(?:`?|\[?)/gim,
    ),
  ].map((m) => ({ name: m[1], columns: [] }));
  const views = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?VIEW\s+(?:`?|\[?)(\w+)(?:`?|\[?)/gim,
    ),
  ].map((m) => ({ name: m[1] }));
  const inserts = [
    ...sql.matchAll(/INSERT\s+INTO\s+(?:`?|\[?)(\w+)(?:`?|\[?)/gim),
  ].map((m) => ({ table: m[1] }));
  const selects = [
    ...sql.matchAll(/SELECT\s+(.*?)\s+FROM\s+(?:`?|\[?)(\w+)(?:`?|\[?)/gim),
  ].map((m) => ({ columns: [{ column: m[1].trim() }], from: [m[2]] }));
  const alters = [
    ...sql.matchAll(
      /ALTER\s+TABLE\s+(?:`?|\[?)(\w+)(?:`?|\[?)\s+(.+?)(?:;|$)/gim,
    ),
  ].map((m) => ({
    table: m[1],
    operations: [{ action: m[2].trim().split(/\s+/)[0], resource: "unknown" }],
  }));
  const drops = [
    ...sql.matchAll(
      /DROP\s+(?:TABLE|VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER|DATABASE)\s+(?:IF\s+EXISTS\s+)?(?:`?|\[?)(\w+)(?:`?|\[?)/gim,
    ),
  ].map((m) => ({ keyword: m[0].split(/\s+/)[1].toLowerCase(), name: m[1] }));
  const functions = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?FUNCTION\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => ({ name: m[1], params: [] }));
  const procedures = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?PROCEDURE\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => ({ name: m[1], params: [] }));

  const triggers = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?TRIGGER\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => ({ name: m[1] }));

  const indexes = [
    ...sql.matchAll(
      /CREATE\s+(?:UNIQUE\s+)?(?:FULLTEXT\s+)?INDEX\s+(?:`?|\[?)(\w+)(?:`?|\]?)\s+ON\s+(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => ({ name: m[1], table: m[2], columns: [] }));

  const updates = [
    ...sql.matchAll(/UPDATE\s+(?:`?|\[?)(\w+)(?:`?|\]?)/gim),
  ].map((m) => ({ table: m[1], set: [] }));

  const deletes = [
    ...sql.matchAll(/DELETE\s+FROM\s+(?:`?|\[?)(\w+)(?:`?|\]?)/gim),
  ].map((m) => ({ from: [m[1]] }));

  return {
    tables,
    views,
    inserts,
    selects,
    alters,
    drops,
    functions,
    procedures,
    triggers,
    indexes,
    updates,
    deletes,
  };
}

export function detectDialect(sql) {
  for (const { pattern, name } of DIALECT_PATTERNS) {
    if (pattern.test(sql)) return name;
  }
  return "mysql";
}

function crearAcumuladores() {
  return {
    tables: [],
    views: [],
    indexes: [],
    functions: [],
    procedures: [],
    triggers: [],
    databases: [],
    inserts: [],
    updates: [],
    deletes: [],
    selects: [],
    alters: [],
    drops: [],
  };
}

function processNodes(ast, content, acc) {
  const nodes = Array.isArray(ast) ? ast : [ast];
  for (const node of nodes) {
    switch (node.type) {
      case "create":
        if (node.keyword === "table") {
          const t = extractCreateTable(node);
          if (t) acc.tables.push(t);
        } else {
          const r = extractOtherCreate(node, content);
          if (r) {
            switch (node.keyword) {
              case "view":
                acc.views.push(r);
                break;
              case "index":
                acc.indexes.push(r);
                break;
              case "function":
                acc.functions.push(r);
                break;
              case "procedure":
                acc.procedures.push(r);
                break;
              case "trigger":
                acc.triggers.push(r);
                break;
              case "database":
              case "schema":
                acc.databases.push(r);
                break;
            }
          }
        }
        break;
      case "insert":
        {
          const r = extractDml(node);
          if (r) acc.inserts.push(r);
        }
        break;
      case "update":
        {
          const r = extractDml(node);
          if (r) acc.updates.push(r);
        }
        break;
      case "delete":
        {
          const r = extractDml(node);
          if (r) acc.deletes.push(r);
        }
        break;
      case "select":
        {
          const r = extractDml(node);
          if (r) acc.selects.push(r);
        }
        break;
      case "alter":
        {
          const r = extractAlter(node);
          if (r) acc.alters.push(r);
        }
        break;
      case "drop":
        {
          const r = extractDrop(node);
          if (r) acc.drops.push(r);
        }
        break;
    }
  }
}
function mergeResults(acc, raw) {
  acc.tables.push(...raw.tables);
  acc.views.push(...raw.views);
  acc.inserts.push(...raw.inserts);
  acc.selects.push(...raw.selects);
  acc.alters.push(...raw.alters);
  acc.drops.push(...raw.drops);
  acc.functions.push(...raw.functions);
  acc.procedures.push(...raw.procedures);
  acc.triggers.push(...raw.triggers);
  acc.indexes.push(...raw.indexes);
  acc.updates.push(...raw.updates);
  acc.deletes.push(...raw.deletes);
}

export function parseSql(content) {
  const dialect = detectDialect(content);
  const comments = extractComments(content);
  const acc = crearAcumuladores();

  if (dialect === "transactsql") {
    const batches = splitBatches(content);
    for (const batch of batches) {
      try {
        const ast = parser.astify(batch, { database: "transactsql" });
        processNodes(ast, batch, acc);
      } catch {
        mergeResults(acc, extractFromRaw(batch));
      }
    }
  } else {
    try {
      const ast = parser.astify(content, { database: dialect });
      processNodes(ast, content, acc);
    } catch {
      mergeResults(acc, extractFromRaw(content));
    }
  }

  return {
    imports: [],
    exports: [],
    classes: acc.tables,
    routes: [],
    functions: [...acc.functions, ...acc.procedures],
    tables: acc.tables,
    views: acc.views,
    indexes: acc.indexes,
    storedProcedures: acc.procedures,
    triggers: acc.triggers,
    databases: acc.databases,
    inserts: acc.inserts,
    updates: acc.updates,
    deletes: acc.deletes,
    selects: acc.selects,
    alterTables: acc.alters,
    drops: acc.drops,
    comments,
  };
}
