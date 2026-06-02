export function extractCreateTable(node) {
  const columns = [];
  const primaryKey = [];
  const foreignKey = [];
  const unique = [];
  const check = [];
  const indexes = [];

  try {
    if (!node || typeof node !== "object") {
      return;
    }
    let tableName = null;
    if (node.type === "create" && node.keyword === "table") {
      tableName = Array.isArray(node.table)
        ? node.table[0].table
        : node.table.table;

      for (const def of node.create_definitions) {
        if (def.resource === "column") {
          columns.push({
            name: def.column.column,
            type: def.definition.dataType,
            length: def.definition.length,
            nullable: def.nullable,
            default: def.default_val,
            autoIncrement: def.auto_increment,
            primary: def.primary,
            unique: def.unique,
            comment: def.comment,
          });
        } else if (def.resource === "constraint") {
          switch (def.constraint_type) {
            case "primary key":
              primaryKey.push({
                constraintType: def.constraint_type,
                constraint: def.constraint,
                definition: def.definition.map((col) => col.column),
              });

              break;
            case "FOREIGN KEY":
              foreignKey.push({
                constraintType: def.constraint_type,
                constraint: def.constraint,
                definition: def.definition.map((col) => col.column),
                reference: {
                  table: def.reference_definition?.table?.[0]?.table,
                  columns:
                    def.reference_definition?.columns?.map((c) => c.column) ||
                    [],
                  onDelete: def.reference_definition?.on_delete || null,
                  onUpdate: def.reference_definition?.on_update || null,
                },
              });
              break;
            case "unique":
              unique.push({
                constraintType: def.constraint_type,
                constraint: def.constraint,
                definition: def.definition.map((col) => col.column),
              });

              break;
            case "check":
              check.push({
                constraintType: def.constraint_type,
                definition: def.definition.map((col) => col.column),
              });
              break;
          }
        } else if (def.resource === "index") {
          indexes.push({
            name: def.index || null,
            type: def.keyword,
            definition: def.definition.map((col) => col.column),
            indexType: def.index_type?.type || null,
          });
        }
      }
    }
    if (!tableName) return null;

    return {
      name: tableName,
      ifNotExists: node.if_not_exists || null,
      columns: columns,
      primaryKey: primaryKey,
      foreignKeys: foreignKey,
      uniqueConstraints: unique,
      check: check,
      indexes: indexes,
    };
  } catch (err) {
    console.error("Error extracting CREATE TABLE:", err);
    return null;
  }
}
