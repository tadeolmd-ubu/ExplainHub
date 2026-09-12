import path from "node:path";
import {
  traverse,
  readFile,
  getFileType,
  isParseable,
} from "./utils/fileUtils.js";
import { parseByType } from "./parsers/parserFactory.js";
import { parsePythonBatch } from "./parsers/pyParser.js";
import { ParserError } from "./errors/parserError.js";
export { saveFile } from "./utils/fileUtils.js";

export class CodeParser {
  async parse(tree, projectPath) {
    const files = [];
    for (const child of tree.children || []) {
      files.push(...traverse(child));
    }

    const results = [];
    const pyFiles = [];

    for (const file of files) {
      if (!isParseable(file)) continue;
      const filePath = path.join(projectPath, file);
      const fileType = getFileType(filePath);
      if (fileType === "python") {
        pyFiles.push(filePath);
      } else {
        try {
          const result = await this.#processFile(filePath);
          results.push(result);
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
        }
      }
    }

    if (pyFiles.length > 0) {
      const contents = await Promise.all(pyFiles.map((fp) => readFile(fp)));
      const parsed = await parsePythonBatch(
        contents.map((c, i) => ({ filePath: pyFiles[i], content: c })),
      );
      for (let i = 0; i < pyFiles.length; i++) {
        const { imports, exports, classes, routes, functions, ...rest } =
          parsed[i] || {};
        results.push({
          filePath: pyFiles[i],
          type: "python",
          imports: imports || [],
          exports: exports || [],
          classes: classes || [],
          routes: routes || [],
          functions: functions || [],
          ...rest,
        });
      }
    }

    return results;
  }
  async #processFile(filePath) {
    const fileContent = await readFile(filePath);
    const fileType = getFileType(filePath);
    try {
      const parsed = await parseByType(fileType, fileContent);
      const { imports, exports, classes, routes, functions, ...rest } = parsed;
      return {
        filePath,
        type: fileType,
        imports,
        exports,
        classes,
        routes,
        functions,
        ...rest,
      };
    } catch (error) {
      throw new ParserError(filePath, error.message, fileType);
    }
  }
}
