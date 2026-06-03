export function statsFormatter(files) {
  const lines = [
    "PROJECT STATISTICS",
    "==================",
    `Files analyzed: ${files.length}`,
    `Total imports: ${countSum(files, "imports")}`,
    `Total exports: ${countSum(files, "exports")}`,
    `Total functions: ${countSum(files, "functions")}`,
    `Total classes: ${countSum(files, "classes")}`,
    `Total routes: ${countSum(files, "routes")}`,
    `Total tables: ${countSum(files, "tables")}`,
    `Total views: ${countSum(files, "views")}`,
    `Total indexes: ${countSum(files, "indexes")}`,
    `Total stored procedures: ${countSum(files, "storedProcedures")}`,
    `Total triggers: ${countSum(files, "triggers")}`,
    `Total databases: ${countSum(files, "databases")}`,
    `Total inserts: ${countSum(files, "inserts")}`,
    `Total updates: ${countSum(files, "updates")}`,
    `Total deletes: ${countSum(files, "deletes")}`,
    `Total selects: ${countSum(files, "selects")}`,
    `Total alter tables: ${countSum(files, "alterTables")}`,
    `Total drops: ${countSum(files, "drops")}`,
    `Total comments: ${countSum(files, "comments")}`,
  ];
  return lines.join("\n");
}

function countSum(files, key) {
  return files.reduce((sum, f) => sum + (f[key]?.length || 0), 0);
}
