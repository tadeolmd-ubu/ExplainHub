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
  
}

export default CodeParser;
