import { extractFromDeclaration } from "./declarationExportExtractor.js";
import { extractCjsExport } from "./cjsExportExtractor.js";

export function extractExports(ast) {
  const exports = [];
  try {
    const visit = (node) => {
      if (!node || typeof node !== "object") return;

      if (node.type === "ExportDefaultDeclaration") {
        exports.push({
          name: "default",
          kind: "default",
          line: node.loc?.start.line || 0,
        });
      }
      if (node.type === "ExportNamedDeclaration") {
        if (node.specifiers && node.specifiers.length > 0) {
          for (const spec of node.specifiers) {
            if (spec.type === "ExportSpecifier") {
              exports.push({
                name: spec.exported.name,
                kind: node.source ? "re-export" : "named",
                source: node.source?.value,
                original:
                  spec.local.name !== spec.exported.name
                    ? spec.local.name
                    : undefined,
                line: node.loc?.start.line || 0,
              });
            }
          }
        }
        if (node.declaration) {
          extractFromDeclaration(node.declaration, exports);
        }
      }
      if (node.type === "ExportAllDeclaration") {
        exports.push({
          name: "*",
          kind: "re-export",
          source: node.source.value,
          line: node.loc?.start.line || 0,
        });
      }
      if (node.type === "AssignmentExpression") {
        extractCjsExport(node, exports);
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
  } catch (error) {
    return [];
  }
  return exports;
}
