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
  { pattern: /\bDATABASE\b/i, name: "mysql" }, // fallback suave
];

export function detectDialect(sql) {
  for (const { pattern, name } of DIALECT_PATTERNS) {
    if (pattern.test(sql)) return name;
  }
  return "mysql";
}

export function parseSql(content) {
  const dialect = detectDialect(content);
  const ast = parser.astify(content, { database: dialect });
  const nodes = Array.isArray(ast) ? ast : [ast];
  const comments = extractComments(content);

  // Acumuladores
  const tables = [], views = [], indexes = [], functions = [];
  const procedures = [], triggers = [], databases = [];
  const inserts = [], updates = [], deletes = [], selects = [];
  const alters = [], drops = [];

  for (const node of nodes) {
    switch (node.type) {
      case "create":
        if (node.keyword === "table") {
          const t = extractCreateTable(node);
          if (t) tables.push(t);
        } else {
          const r = extractOtherCreate(node, content);
          if (r) {
            switch (node.keyword) {
              case "view": views.push(r); break;
              case "index": indexes.push(r); break;
              case "function": functions.push(r); break;
              case "procedure": procedures.push(r); break;
              case "trigger": triggers.push(r); break;
              case "database": case "schema": databases.push(r); break;
            }
          }
        }
        break;
      case "insert": { const r = extractDml(node); if (r) inserts.push(r); } break;
      case "update": { const r = extractDml(node); if (r) updates.push(r); } break;
      case "delete": { const r = extractDml(node); if (r) deletes.push(r); } break;
      case "select": { const r = extractDml(node); if (r) selects.push(r); } break;
      case "alter": { const r = extractAlter(node); if (r) alters.push(r); } break;
      case "drop": { const r = extractDrop(node); if (r) drops.push(r); } break;
    }
  }

  return {
    imports: [],
    exports: [],
    classes: tables,
    routes: [],
    functions: [...functions, ...procedures],
    tables, views, indexes,
    storedProcedures: procedures,
    triggers,
    databases,
    inserts, updates, deletes, selects,
    alterTables: alters,
    drops,
    comments,
  };
}
