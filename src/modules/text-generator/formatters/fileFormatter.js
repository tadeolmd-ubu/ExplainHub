export function fileFormatter(file) {
  const { filePath, type, imports, exports, functions, classes, routes } = file;

  const lines = [
    `-- ${filePath} (${type}) --`,
    fmtLabel("Imports", fmtImports(imports)),
    fmtLabel("Exports", fmtExports(exports)),
    fmtLabel("Functions", fmtFunctions(functions)),
    fmtLabel("Classes", fmtClasses(classes)),
    fmtLabel("Routes", fmtRoutes(routes)),
  ].filter(Boolean);
  return lines.join("\n");
}

function fmtLabel(label, value) {
  if (!value) {
    return "";
  }
  return `${label}: ${value}`;
}
function fmtRoutes(routes) {
  if (!routes?.length) {
    return "";
  }
  return routes.map((r) => `${r.method} ${r.path}`).join(", ");
}
function fmtImports(imports) {
  if (!imports?.length) {
    return "";
  }
  return imports.map((i) => i.source).join(", ");
}
function fmtExports(exports) {
  if (!exports?.length) {
    return "";
  }
  return exports.map((e) => `${e.name} (${e.kind})`).join(", ");
}
function fmtClasses(classes) {
  if (!classes?.length) {
    return "";
  }
  return classes
    .map((c) => {
      if (c.extends) return `${c.name} extends ${c.extends}`;
      return c.name;
    })
    .join(", ");
}
function fmtFunctions(functions) {
  if (!functions?.length) {
    return "";
  }
  return functions
    .map((f) => {
      let str = `${f.name} (${f.kind})`;
      if (f.async) str += " async";
      return str;
    })
    .join(", ");
}
