export function extractOtherCreate(node, sqlContent) {
  if (!node || typeof node !== "object") return null;
  switch (node.keyword) {
    case "view":
      return extractCreateView(node);
    case "index":
      return extractCreateIndex(node);
    case "function":
      return extractCreateFunction(node, sqlContent);
    case "procedure":
      return extractCreateProcedure(node, sqlContent);
    case "trigger":
      return extractCreateTrigger(node, sqlContent);
    case "database":
    case "schema":
      return { name: node.database || node.table?.table };
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
      let name = null;
      if (node.table) {
        name = Array.isArray(node.table)
          ? node.table[0].table
          : node.table.table;
      } else if (node.name && node.name[0] && node.name[0].table) {
        name = node.name[0].table;
      }
      return {
        name,
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

function extractCreateFunction(node, sqlContent) {
  try {
    if (!node || typeof node !== "object") return null;
    if (!(node.type === "create" && node.keyword === "function")) return null;

    const regex =
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?FUNCTION\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)\s*\(([^)]*)\)\s*RETURNS\s+(@?\w+(?:\s+TABLE)?)/i;
    const match = sqlContent.match(regex);
    if (!match) return null;

    const params = [];
    const paramRegex =
      /\s*(IN|OUT|INOUT)?\s*(?:`?|\[?)(@?\w+)(?:`?|\]?)\s+(\w+(?:\([^)]*\))?)/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(match[2])) !== null) {
      params.push({
        mode: (paramMatch[1] || "IN").toUpperCase(),
        name: paramMatch[2],
        type: paramMatch[3],
      });
    }

    return {
      name: match[1],
      params,
      returnType: match[3],
    };
  } catch (err) {
    console.error("Error extracting CREATE FUNCTION:", err);
    return null;
  }
}
function extractCreateProcedure(node, sqlContent) {
  try {
    if (!node || typeof node !== "object") return null;
    if (!(node.type === "create" && node.keyword === "procedure")) return null;

    const regex =
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?PROCEDURE\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)\s*(?:\(([^)]*)\))?/i;
    const match = sqlContent.match(regex);
    if (!match) return null;

    const params = [];
    const paramRegex =
      /\s*(IN|OUT|INOUT)?\s*(?:`?|\[?)(@?\w+)(?:`?|\]?)\s+(\w+(?:\([^)]*\))?)/g;
    let pm;
    while ((pm = paramRegex.exec(match[2])) !== null) {
      params.push({
        mode: (pm[1] || "IN").toUpperCase(),
        name: pm[2],
        type: pm[3],
      });
    }

    return {
      name: match[1],
      params,
    };
  } catch (err) {
    console.error("Error extracting CREATE PROCEDURE:", err);
    return null;
  }
}

function extractCreateTrigger(node, sqlContent) {
  try {
    if (!node || typeof node !== "object") return null;
    if (!(node.type === "create" && node.keyword === "trigger")) return null;

    const regex =
      /CREATE\s+(?:OR\s+(?:REPLACE|ALTER)\s+)?TRIGGER\s+(?:(?:`?|\[?)\w+(?:`?|\]?)\.)?(?:`?|\[?)(\w+)(?:`?|\]?)\s*(BEFORE|AFTER|FOR)\s+(INSERT|UPDATE|DELETE)\s+ON\s+(?:`?|\[?)(\w+)(?:`?|\]?)/i;
    const match = sqlContent.match(regex);
    if (!match) return null;

    return {
      name: match[1],
      timing: match[2].toUpperCase(),
      event: match[3].toUpperCase(),
      table: match[4],
    };
  } catch (err) {
    console.error("Error extracting CREATE TRIGGER:", err);
    return null;
  }
}
