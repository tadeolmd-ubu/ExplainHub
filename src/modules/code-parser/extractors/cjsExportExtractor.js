export function extractCjsExport(node, exports) {
  const left = node.left;
  if (
    left.type === "MemberExpression" &&
    left.object.type === "Identifier" &&
    left.object.name === "module" &&
    left.property.type === "Identifier" &&
    left.property.name === "exports"
  ) {
    exports.push({
      name: "default",
      kind: "cjs",
      line: node.loc?.start.line || 0,
    });
    if (node.right?.type === "ObjectExpression") {
      for (const prop of node.right.properties) {
        if (prop.key?.name) {
          exports.push({
            name: prop.key.name,
            kind: "cjs",
            line: node.loc?.start.line || 0,
          });
        }
      }
    }
  }
  if (
    left.type === "MemberExpression" &&
    left.object.type === "Identifier" &&
    left.object.name === "exports" &&
    left.property.type === "Identifier"
  ) {
    exports.push({
      name: left.property.name,
      kind: "cjs",
      line: node.loc?.start.line || 0,
    });
  }
}
