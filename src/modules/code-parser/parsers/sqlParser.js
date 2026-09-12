import sqlParser from "node-sql-parser";
const { Parser } = sqlParser;
const parser = new Parser();

import { extractAlter } from "../extractors/alterExtractor.js";
import { extractComments } from "../extractors/commentExtractor.js";
import { extractOtherCreate } from "../extractors/createOtherExtractor.js";
import { extractCreateTable } from "../extractors/createTableExtractor.js";
import { extractDml } from "../extractors/dmlExtractor.js";
import { extractDrop } from "../extractors/dropExtractor.js";

const DIALECT_PATTERNS = [
  { pattern: /\[[\w@#]+]/, name: "transactsql" },
  { pattern: /\bTOP\b/i, name: "transactsql" },
  { pattern: /\bIDENTITY\b/i, name: "transactsql" },
  { pattern: /\bOUTPUT\b/i, name: "transactsql" },
  { pattern: /\bGO\b/i, name: "transactsql" },
  { pattern: /`.*?`/, name: "mysql" },
  { pattern: /\bAUTO_INCREMENT\b/i, name: "mysql" },
  { pattern: /\bSERIAL\b/i, name: "postgresql" },
  { pattern: /\b::\b/, name: "postgresql" },
  { pattern: /\bPLPGSQL\b/i, name: "postgresql" },
  { pattern: /\bDATABASE\b/i, name: "mysql" },
];

// ─── HELPER: PARTIR POR GO ────────────────────────────────
function splitBatches(sql) {
  return sql
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !/^\s*PRINT\b/i.test(b));
}

// ─── HELPER: PARTIR EN STATEMENTS INDIVIDUALES ─────────────
function splitStatements(batch) {
  const stmts = [];
  let remaining = batch;
  while (remaining.length > 0) {
    const stmtMatch = remaining.match(/^(CREATE\s+TABLE[\s\S]*?\);)/im);
    if (stmtMatch) {
      stmts.push(stmtMatch[1].trim());
      remaining = remaining.slice(stmtMatch.index + stmtMatch[0].length).trim();
      continue;
    }
    const semiMatch = remaining.match(/^(.*?;)/s);
    if (semiMatch) {
      const s = semiMatch[1].trim();
      if (s.length > 0) stmts.push(s);
      remaining = remaining.slice(semiMatch.index + semiMatch[0].length).trim();
      continue;
    }
    // last chunk without semicolon
    const s = remaining.trim();
    if (s.length > 0) stmts.push(s);
    break;
  }
  return stmts;
}

// ─── HELPER: FALLBACK POR REGEX ──────────────────────────
function extractTableBody(sql, matchIndex) {
  // Find the opening ( after the CREATE TABLE name
  const from = matchIndex;
  let i = from;
  // Skip past CREATE TABLE [IF NOT EXISTS] [schema.]name
  while (i < sql.length && sql[i] !== "(") {
    i++;
  }
  if (i >= sql.length) return "";
  // Count balanced parens to find closing )
  let depth = 0;
  for (let j = i; j < sql.length; j++) {
    if (sql[j] === "(") depth++;
    else if (sql[j] === ")") { depth--; if (depth === 0) return sql.slice(i, j + 1); }
  }
  return "";
}

function extractTableColumns(body) {
  if (!body || !body.startsWith("(")) return [];
  const inner = body.slice(1, -1).trim();
  const cols = [];
  const parts = inner.split(/,(?![^(]*\))/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || /^(FOREIGN|CONSTRAINT|INDEX|PRIMARY|UNIQUE|CHECK)\s/i.test(trimmed)) continue;
    const colMatch = trimmed.match(/^(?:`?|\[?)(\w+)(?:`?|\]?)\s+([^,]+)/i);
    if (colMatch) {
      cols.push({ name: colMatch[1], type: colMatch[2].trim().replace(/\s+IDENTITY.*$/i, ""), nullable: !/NOT\s+NULL/i.test(trimmed), default: null });
    }
  }
  return cols;
}

function extractParamsFromText(sql) {
  // Get text after the CREATE FUNCTION/PROCEDURE header
  const afterName = sql.replace(/^\s*CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?(?:FUNCTION|PROCEDURE)\s+(?:\w+\.)?(?:`?|\[?)\w+(?:`?|\]?)\s*/i, "").trim();
  if (!afterName) return [];

  const stopIdx = afterName.search(/\b(?:AS|BEGIN|RETURNS|LANGUAGE)\b/i);
  const headerSection = stopIdx > 0 ? afterName.slice(0, stopIdx).trim() : afterName.slice(0, 200).trim();

  // Try parenthesized params: name(param1, param2)
  if (headerSection.startsWith("(")) {
    let depth = 0;
    let end = 0;
    for (let i = 0; i < headerSection.length; i++) {
      if (headerSection[i] === "(") depth++;
      else if (headerSection[i] === ")") { depth--; if (depth === 0) { end = i; break; } }
    }
    const paramsList = headerSection.slice(1, end).trim();
    if (paramsList) return parseParamList(paramsList);
  }

  // SQL Server style: @param1 TYPE, @param2 TYPE (no parens)
  return parseParamList(headerSection);
}

function parseParamList(text) {
  const params = [];
  const paramRegex = /\s*(IN|OUT|INOUT)?\s*(?:`?|\[?)(@?\w+)(?:`?|\]?)\s+(\w+(?:\s*\([^)]*\))?)/g;
  let m;
  while ((m = paramRegex.exec(text)) !== null) {
    if (/^(DECLARE|SET|SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AS|BEGIN|END|RETURN|RETURNS|TABLE|IF|ELSE|WHILE|CURSOR|FETCH|COMMIT|ROLLBACK|PRINT|RAISERROR|THROW|TRY|CATCH)$/i.test(m[2])) continue;
    params.push({
      mode: (m[1] || "IN").toUpperCase(),
      name: m[2],
      type: m[3],
    });
  }
  return params;
}

function extractFromRaw(sql) {
 const tables = [...sql.matchAll(
  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:`?|\[?)\w+(?:`?|\]?)(?:\s*\.\s*(?:`?|\[?)\w+(?:`?|\]?))?)/gim,
)].map((m) => {
  const full = m[1];
  const name = full.split('.').pop().replace(/^`|`$|^\[|\]$/g, '');
  const body = extractTableBody(sql, m.index);
  const cols = extractTableColumns(body);
  return { name, columns: cols, foreignKeys: [], primaryKey: [], uniqueConstraints: [], check: [], indexes: [] };
});

  const views = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?VIEW\s+(?:`?|\[?)(\w+)(?:`?|\[?)/gim,
    ),
  ].map((m) => ({ name: m[1], select: null }));

  const inserts = [
    ...sql.matchAll(/INSERT\s+INTO\s+(?:`?|\[?)(\w+)(?:`?|\[?)/gim),
  ].map((m) => ({ table: m[1], columns: [], values: null }));

  const selects = [
    ...sql.matchAll(/SELECT\s+(.*?)\s+FROM\s+(?:`?|\[?)(\w+)(?:`?|\[?)/gim),
  ].map((m) => ({ columns: [{ column: m[1].trim() }], from: [m[2]], joins: [], where: null, groupBy: [], having: null, orderBy: [], limit: null, distinct: false }));

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
  ].map((m) => {
    const params = extractParamsFromText(sql.slice(m.index, m.index + 500));
    let returnType = null;
    const rtMatch = sql.slice(m.index).match(/RETURNS\s+(@?\w+(?:\s+TABLE)?)/i);
    if (rtMatch) returnType = rtMatch[1];
    return { name: m[1], params, returnType };
  });

  const procedures = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?PROCEDURE\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => {
    const params = extractParamsFromText(sql.slice(m.index, m.index + 500));
    return { name: m[1], params };
  });

  const triggers = [
    ...sql.matchAll(
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?TRIGGER\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => {
    const ctx = sql.slice(m.index);
    // SQL Server: ON table AFTER|FOR event
    let detailMatch = ctx.match(/ON\s+(?:`?|\[?)(\w+)(?:`?|\]?)\s+(?:OF\s+)?(BEFORE|AFTER|FOR|INSTEAD\s+OF)\s+(INSERT|UPDATE|DELETE)/i);
    if (detailMatch) {
      return { name: m[1], timing: detailMatch[2].toUpperCase().replace(/\s+/g, "_"), event: detailMatch[3].toUpperCase(), table: detailMatch[1] };
    }
    // MySQL/Postgres: BEFORE|AFTER event ON table
    detailMatch = ctx.match(/(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+ON\s+(?:`?|\[?)(\w+)(?:`?|\]?)/i);
    if (detailMatch) {
      return { name: m[1], timing: detailMatch[1].toUpperCase(), event: detailMatch[2].toUpperCase(), table: detailMatch[3] };
    }
    return { name: m[1], timing: null, event: null, table: null };
  });

  const indexes = [
    ...sql.matchAll(
      /CREATE\s+(?:UNIQUE\s+)?(?:FULLTEXT\s+)?INDEX\s+(?:`?|\[?)(\w+)(?:`?|\]?)\s+ON\s+(?:`?|\[?)(\w+)(?:`?|\]?)/gim,
    ),
  ].map((m) => ({ name: m[1], table: m[2], columns: [], type: null, using: null }));

  const updates = [
    ...sql.matchAll(/UPDATE\s+(?:`?|\[?)(\w+)(?:`?|\]?)/gim),
  ].map((m) => ({ table: m[1], set: [] }));

  const deletes = [
    ...sql.matchAll(/DELETE\s+FROM\s+(?:`?|\[?)(\w+)(?:`?|\]?)/gim),
  ].map((m) => ({ from: [m[1]], where: null }));

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
        try {
          const ast = parser.astify(batch, { database: "mysql" });
          processNodes(ast, batch, acc);
        } catch {
          // Fallback 1: try each statement individually
          const stmts = splitStatements(batch);
          if (stmts.length === 0) {
            mergeResults(acc, extractFromRaw(batch));
          } else {
            for (const stmt of stmts) {
              try {
                const ast = parser.astify(stmt, { database: "mysql" });
                processNodes(ast, stmt, acc);
              } catch {
                mergeResults(acc, extractFromRaw(stmt));
              }
            }
          }
        }
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
