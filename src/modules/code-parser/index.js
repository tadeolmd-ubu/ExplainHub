import fs from "node:fs/promises";
import path from "node:path";
import parser from "@babel/parser";
import { fileTypes } from "./fileTypes.js";

//npm install --save-dev @babel/parser
class CodeParser {
  async parse(tree, technologies, projectPath) {
    const files = [];
    for (const child of tree.children || []) {
      files.push(...this.#traverse(child));
    }

    const results = [];

    for (const file of files) {
      if (this.#isParseable(file, technologies)) {
        try {
          const filePath = path.join(projectPath, file);
          const result = await this.#processFile(filePath);
          results.push(result);
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
        }
      }
    }

    return results;
  }
  async #processFile(filePath) {
    const fileContent = await this.#readFile(filePath);
    const fileType = this.#getFileType(filePath);
    const parsed = this.#parseByType(fileType, fileContent);
    return {
      filePath,
      type: fileType,
      imports: parsed.imports,
      exports: parsed.exports,
      classes: parsed.classes,
      routes: parsed.routes,
      functions: parsed.functions,
    };
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
}

export default CodeParser;
