export function extractClasses(ast) {
  const classes = [];

  try {
    const visit = (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "ClassDeclaration") {
        const methods = [];
        for (const child of node.body?.body || []) {
          if (child.type === "ClassMethod" && child.key?.name) {
            methods.push({
              name: child.key.name,
              kind: "method",
              params: (child.params || []).map((p) => p.name),
              async: child.async || false,
              line: child.loc?.start.line || 0,
            });
          }
        }
        classes.push({
          name: node.id?.name || "Anonymous",
          extends: node.superClass?.name,
          line: node.loc?.start.line || 0,
          methods,
        });
      }
      for (const key in node) {
        if (key === "loc" || key === "range" || key === "comments") continue;
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            visit(item);
          }
        } else if (typeof child === "object") {
          visit(child);
        }
      }
    };
    visit(ast);
    return classes;
  } catch (error) {
    console.error("Error extracting classes:", error);
    return [];
  }
}
