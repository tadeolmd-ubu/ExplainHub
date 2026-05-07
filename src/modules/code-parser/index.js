import fs from "node:fs/promises";
import path from "node:path";

//npm install --save-dev @babel/parser
class CodeParser {
  async parse(tree, technologies) {}

  #traverse(tree) {}

  #isParseable(filePath, technologies) {}

  async #processFile(filePath) {}

  async #readFile(filePath) {}

  #getFileType(filePath) {}

  #parseByType(fileType, content) {}

  #parseJavaScript(content) {
    const ast = parser.parse(content, {
      sourceType: "unambiguous",
      allowReturnOutsideFunction: true,
      plugins: ["dynamicImport"],
    });
    return {
      exports: this.#extractExports(ast),
      classes: this.#extractClasses(ast),
    };
  }

  #extractImports(content) {}

  #extractFunctions(content) {}

  #extractRoutes(content) {}
  /*
   * EXTRAE CLASES
   *
   * QUÉ DEBE HACER:
   * - Detectar class MyClass
   * - Retornar nombres de clases
   *
   * QUÉ NO DEBE HACER:
   * - No debe detectar funciones
   * - No debe detectar exports
   */
  #extractClasses(ast) {
    const classes = [];

    try {
      const visit = (node) => {
        if (!node || typeof node !== "object") {
          return;
        }
        if (node.type === "ClassDeclaration") {
          classes.push({
            name: node.id?.name || "Anonymous",
            extends: node.superClass?.name,
            line: node.loc?.start.line || 0,
            methods: this.#extractMethods(node),
          });
        }
        for (const key in node) {
          if (
            key === "loc" ||
            key === "range" ||
            key === "leadingComments" ||
            key === "trailingComments"
          )
            continue;

          const child = node[key];
          if (Array.isArray(child)) {
            for (const item of child) visit(item);
          } else if (typeof child === "object") {
            visit(child);
          }
        }
      };
      visit(ast);
      return classes;
    } catch (error) {
      console.error("Error extracting classes:", error);
    }
  }

  /*
   * EXTRAE EXPORTS
   *
   * QUÉ DEBE HACER:
   * - Detectar export default
   * - Detectar module.exports
   * - Detectar exports.xxx
   * - Retornar exports encontrados
   *
   * QUÉ NO DEBE HACER:
   * - No debe detectar imports
   * - No debe detectar rutas
   */
  #extractExports(content) {
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
            this.#extractFromDeclaration(node.declaration, exports);
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
          this.#extractCjsExport(node, exports);
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
  #extractFromDeclaration(declaration, exports) {
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
  #extractCjsExport(node, exports) {
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
}

export default CodeParser;
