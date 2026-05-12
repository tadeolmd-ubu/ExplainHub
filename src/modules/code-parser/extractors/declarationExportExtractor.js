export function extractFromDeclaration(declaration, exports) {
  if (declaration.type === "VariableDeclaration") {
    for (const decl of declaration.declarations) {
      if (decl.id.type === "Identifier") {
        exports.push({
          name: decl.id.name,
          kind: declaration.kind,
          line: declaration.loc?.start.line || 0,
        });
      }
    }
  } else if (declaration.type === "FunctionDeclaration") {
    exports.push({
      name: declaration.id?.name,
      kind: "function",
      line: declaration.loc?.start.line || 0,
    });
  } else if (declaration.type === "ClassDeclaration") {
    exports.push({
      name: declaration.id?.name,
      kind: "class",
      line: declaration.loc?.start.line || 0,
    });
  }
}
