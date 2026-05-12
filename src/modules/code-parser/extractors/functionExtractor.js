export function extractFunctions(ast) {
  const functions = [];

  try {
    const visit = (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "FunctionDeclaration") {
        functions.push({
          name: node.id.name,
          kind: "function",
          params: (node.params || []).map((p) => p.name),
          async: node.async || false,
          line: node.loc?.start.line || 0,
        });
      }
      if (node.type === "ClassMethod" && node.key?.name) {
        functions.push({
          name: node.key.name,
          kind: "method",
          params: (node.params || []).map((p) => p.name),
          async: node.async || false,
          line: node.loc?.start.line || 0,
        });
      }
      if (
        node.type === "VariableDeclarator" &&
        node.id?.type === "Identifier" &&
        node.init &&
        (node.init.type === "FunctionExpression" ||
          node.init.type === "ArrowFunctionExpression")
      ) {
        functions.push({
          name: node.id.name,
          kind:
            node.init.type === "ArrowFunctionExpression"
              ? "arrow"
              : "expression",
          params: (node.init.params || []).map((p) => p.name),
          async: node.init.async || false,
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
    return functions;
  } catch (error) {
    console.error("Error extracting functions:", error);
    return [];
  }
}
