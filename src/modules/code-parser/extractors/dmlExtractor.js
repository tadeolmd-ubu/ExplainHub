export function extractDml(node) {
     if (!node || typeof node !== "object") return null;
  switch (node.type) {
    case "insert": return extractInsert(node);
    case "update": return extractUpdate(node);
    case "delete": return extractDelete(node);
    case "select": return extractSelect(node);
    default: return null;
  }
}

function extractInsert(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "insert") {
      return {
        table: node.table.table || node.table[0]?.table,
        columns: node.columns,
        values: node.values,
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting INSERT:", err);
    return null;
  }
}

function extractUpdate(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "update") {
      return {
        table: Array.isArray(node.table)
          ? node.table[0].table
          : node.table.table,
        set:
          node.set?.map((s) => ({
            column: s.column,
            value: s.value,
          })) || [],
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting UPDATE:", err);
    return null;
  }
}

function extractDelete(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "delete") {
      return {
        from: node.from?.map((f) => f.table) || [],
        where: node.where,
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting DELETE:", err);
    return null;
  }
}

function extractSelect(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "select") {
      return {
        columns: node.columns?.map((c) => {
          const expr = c.expr;
          if (expr.type === "star") return { column: "*", alias: null };
          if (expr.type === "column_ref")
            return {
              column: expr.column,
              table: expr.table,
              alias: c.as?.value,
            };
          if (expr.type === "function")
            return {
              column: "function",
              name: expr.name?.name?.[0]?.value,
              alias: c.as?.value,
            };
          return {
            column: expr.column || expr.value || "expr",
            alias: c.as?.value,
          };
        }),
        from: node.from?.filter((f) => !f.join).map((f) => f.table),
        joins: node.from
          ?.filter((f) => f.join)
          .map((f) => ({ type: f.join, table: f.table, on: f.on })),
        where: node.where,
        groupBy: node.groupby?.columns?.map((c) => c.column),
        having: node.having,
        orderBy: node.orderby?.map((o) => ({
          column: o.expr.column,
          direction: o.type,
        })),
        limit: node.limit?.value?.[0]?.value,
        distinct: !!node.distinct,
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting SELECT:", err);
    return null;
  }
}

function extractAlter(node) {
  try {
    if (!node || typeof node !== "object") return null;
    if (node.type === "alter") {
      return {
        table: node.table[0]?.table,
        operations:
          node.expr?.map((op) => {
            const base = {
              action: op.action,
              resource: op.resource,
            };

            switch (op.resource) {
              case "column":
                return {
                  ...base,
                  column: op.column?.column,
                  definition: op.definition
                    ? {
                        type: op.definition.dataType,
                        length: op.definition.length,
                      }
                    : null,
                  nullable: op.nullable?.value === "not null",
                };

              case "table":
                return {
                  ...base,
                  newName: op.table,
                };

              case "constraint":
                return {
                  ...base,
                  constraint: op.create_definitions?.constraint,
                  constraintType: op.create_definitions?.constraint_type,
                  columns: op.create_definitions?.definition?.map(
                    (c) => c.column,
                  ),
                  reference: op.create_definitions?.reference_definition
                    ? {
                        table:
                          op.create_definitions.reference_definition.table?.[0]
                            ?.table,
                        columns:
                          op.create_definitions.reference_definition.definition?.map(
                            (c) => c.column,
                          ),
                      }
                    : null,
                };

              default:
                return base;
            }
          }) || [],
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting ALTER:", err);
    return null;
  }
}

function extractDrop(node) {
  try {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "drop") {
      return {
        name: Array.isArray(node.name)
          ? node.name.map((n) => n.table || n)
          : node.name?.table || node.name,
        keyword: node.keyword,
      };
    }
    return null;
  } catch (err) {
    console.error("Error extracting DROP:", err);
    return null;
  }
}
