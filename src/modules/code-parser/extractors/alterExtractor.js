export function extractAlter(node) {
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
                if (
                  op.create_definitions?.constraint_type?.toLowerCase() ===
                  "default"
                ) {
                  return {
                    ...base,
                    constraint: op.create_definitions?.constraint,
                    column: op.create_definitions?.column?.column,
                    default_val: op.create_definitions?.default_val,
                  };
                }
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

              case "default":
                return {
                  ...base,
                  constraint: op.constraint,
                  column: op.column?.column,
                  default_val: op.default_val,
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
