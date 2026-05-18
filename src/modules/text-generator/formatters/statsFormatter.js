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
  ];
  return lines.join("\n");
}

function countSum(files, key) {
  return files.reduce((sum, f) => sum + (f[key]?.length || 0), 0);
}
