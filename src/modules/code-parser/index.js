import path from "node:path";
import {
  traverse,
  readFile,
  getFileType,
  isParseable,
} from "./utils/fileUtils.js";
import { parseByType } from "./parsers/parserFactory.js";
import { ParserError } from "./errors/parserError.js";

//npm install --save-dev @babel/parser
export class CodeParser {
  async parse(tree, projectPath) {
    const files = [];
    for (const child of tree.children || []) {
      files.push(...traverse(child));
    }

    const results = [];

    for (const file of files) {
      if (isParseable(file)) {
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
    const fileContent = await readFile(filePath);
    const fileType = getFileType(filePath);
    try {
      const parsed = parseByType(fileType, fileContent);
      return {
        filePath,
        type: fileType,
        imports: parsed.imports,
        exports: parsed.exports,
        classes: parsed.classes,
        routes: parsed.routes,
        functions: parsed.functions,
      };
    } catch (error) {
      throw new ParserError(filePath, error.message, fileType);
    }
  }
}
