export function extractRoutes(ast) {
  const routes = [];
  const httpMethods = ["get", "post", "put", "delete", "patch"];
  try {
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      if (
        node.type === "CallExpression" &&
        node.callee?.type === "MemberExpression" &&
        node.callee.property?.name &&
        httpMethods.includes(node.callee.property.name.toLowerCase())
      ) {
        const pathArg = node.arguments[0];
        if (!pathArg || pathArg.type !== "StringLiteral") return;
        routes.push({
          method: node.callee.property.name.toUpperCase(),
          path: pathArg.value,
          line: node.loc?.start.line || 0,
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
    return routes;
  } catch (error) {
    console.error("Error extracting routes:", error);
    return [];
  }
}
