import fs from "node:fs/promises";
import path from "node:path";
import parser from "@babel/parser";
import { fileTypes } from "./fileTypes.js";

//npm install --save-dev @babel/parser
class CodeParser {
  async parse(tree, technologies, projectPath) {}

  #traverse(tree) {}

  #isParseable(filePath, technologies) {
  const type = this.#getFileType(filePath);
  return type === "javascript" || type === "typescript";
}

  async #processFile(filePath) {
    const fileContent = await this.#readFile(filePath);
    const fileType = this.#getFileType(filePath);
    const parsed = this.#parseByType(fileType, fileContent);
    return {
      filePath,
      type: fileType,
      exports: parsed.exports,
      classes: parsed.classes,
      routes: parsed.routes,
      functions: parsed.functions,
    };
  }

  async #readFile(filePath) {
    return fs.readFile(filePath, "utf-8");
  }

  #getFileType(filePath) {
    const ext = path.extname(filePath);
    return fileTypes[ext] || "unknown";
  }
  #parseByType(fileType, content) {
    if (fileType === "javascript" || fileType === "typescript") {
      return this.#parseJavaScript(content);
    }
    return {};
  }

  #parseJavaScript(content) {
    const ast = parser.parse(content, {
      sourceType: "unambiguous",
      allowReturnOutsideFunction: true,
      plugins: ["dynamicImport"],
    });
    return {
      imports: this.#extractImports(ast),
      exports: this.#extractExports(ast),
      classes: this.#extractClasses(ast),
      routes: this.#extractRoutes(ast),
      functions: this.#extractFunctions(ast),
    };
  }

  #extractImports(ast) {
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
      ("Error extracting functions:", error);
      return [];
    }
  }
  /*
   * EXTRAE FUNCIONES
   *
   * QUÉ DEBE HACER:
   * - Detectar function declarations
   * - Detectar arrow functions
   * - Retornar nombres encontrados
   *
   * QUÉ NO DEBE HACER:
   * - No debe detectar imports
   * - No debe detectar clases
   * - No debe detectar rutas
   */
  #extractFunctions(ast) {
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

  /*
   * EXTRAE RUTAS DE EXPRESS
   *
   * QUÉ DEBE HACER:
   * - Detectar app.get(...)
   * - Detectar app.post(...)
   * - Detectar router.get(...)
   * - Retornar rutas encontradas
   *
   * QUÉ NO DEBE HACER:
   * - No debe detectar imports
   * - No debe detectar funciones generales
   */
  #extractRoutes(ast) {
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
          routes.push({
            method: node.callee.property.name.toUpperCase(),
            path: node.arguments[0]?.value,
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
            methods: this.#extractFunctions(node),
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
  #extractExports(ast) {
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
