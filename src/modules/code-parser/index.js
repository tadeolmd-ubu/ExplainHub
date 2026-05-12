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
}

export default CodeParser;
