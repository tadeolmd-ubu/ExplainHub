

export function extractImports(ast) {
  const imports = [];

  try {
    const visit = (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "ImportDeclaration") {
        imports.push({
          type: "esm",
          source: node.source.value,
          specifiers: node.specifiers.map((spec) => ({
            kind:
              spec.type === "ImportDefaultSpecifier"
                ? "default"
                : spec.type === "ImportNamespaceSpecifier"
                  ? "namespace"
                  : "named",
            imported: spec.imported?.name || spec.local?.name,
            local: spec.local?.name,
          })),
          line: node.loc?.start.line || 0,
        });
      }
      if (
        node.type === "CallExpression" &&
        node.callee?.type === "Identifier" &&
        node.callee.name === "require" &&
        node.arguments[0]?.type === "StringLiteral"
      ) {
        imports.push({
          type: "cjs",
          source: node.arguments[0].value,
          line: node.loc?.start.line || 0,
        });
      }
      for (const key in node) {
        if (key === "loc" || key === "range" || key === "comments") continue;
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) visit(item);
        } else if (typeof child === "object") {
          visit(child);
        }
      }
    };
    visit(ast);
    return imports;
  } catch (error) {
    console.error("Error extracting imports:", error);
    return [];
  }
}
