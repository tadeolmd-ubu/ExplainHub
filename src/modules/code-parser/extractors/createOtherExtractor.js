import { Parser } from "node-sql-parser";

const parser = new Parser();

export function extractOtherCreate(node) {
  if (!node || typeof node !== "object") return null;
  switch (node.keyword) {
    case "view":
      return extractCreateView(node);
    case "index":
      return extractCreateIndex(node);
    default:
      return null;
  }
}
function extractCreateView(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "create" && node.keyword === "view") {
      return {
        name: Array.isArray(node.table)
          ? node.table[0].table
          : node.table.table,
        select: node.query_expr,
      };
    }
  } catch (err) {
    console.error("Error extracting CREATE VIEW:", err);
    return null;
  }
}

function extractCreateIndex(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "create" && node.keyword === "index") {
      return {
        name: node.index,
        table: Array.isArray(node.table)
          ? node.table[0].table
          : node.table.table,
        columns: node.index_columns?.map((col) => col.column) || [],
        type: node.index_type,
        using: node.index_using,
      };
    }
  } catch (err) {
    console.error("Error extracting CREATE INDEX:", err);
    return null;
  }
}

function extractCrrerrateFunction(node, sqlContent){}