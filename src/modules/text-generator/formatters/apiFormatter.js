export function apiFormatter(files) {
  const filesWithRoutes = files.filter((f) => f.routes?.length);
  if (!filesWithRoutes.length) return null;
  const lines = ["API ENDPOINTS", "============="];
  for (const file of filesWithRoutes) {
    for (const route of file.routes) {
      lines.push(fmtRouteLine(route, file.filePath));
    }
  }
  return lines.join("\n");
}
function fmtRouteLine(route, filePath) {
  const method = route.method.padEnd(6);
  const path = route.path.padEnd(25);
  return `${method}${path} → ${filePath}:${route.line}`;
}
