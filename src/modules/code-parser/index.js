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
import { resolveRoutes } from "./resolveRoutes.js";
export { saveFile } from "./utils/fileUtils.js";

export class CodeParser {
  async parse(tree, projectPath) {
    this.diagnostics = [];
    this.skippedFiles = [];
    const files = [];
    for (const child of tree.children || []) {
      files.push(...traverse(child));
    }

    const results = [];
    const pyFiles = [];

    for (const file of files) {
      if (!isParseable(file)) { this.skippedFiles.push(file); continue; }
      const filePath = path.join(projectPath, file);
      const fileType = getFileType(filePath);
      if (fileType === "python") {
        pyFiles.push(filePath);
      } else {
        try {
          const result = await this.#processFile(filePath);
          for (const message of result.warnings || []) this.diagnostics.push({ filePath, stage: "parser", severity: "warning", message });
          results.push(result);
        } catch (error) {
          this.diagnostics.push({ filePath, stage: "parser", message: error.message });
        }
      }
    }

    for (let offset = 0; offset < pyFiles.length; offset += 8) {
      const batch = [];
      for (const filePath of pyFiles.slice(offset, offset + 8)) {
        try { batch.push({ filePath, content: await readFile(filePath) }); }
        catch (error) { this.diagnostics.push({ filePath, stage: "parser", message: error.message }); }
      }
      let parsed;
      try { parsed = batch.length ? await parsePythonBatch(batch) : []; }
      catch (error) {
        for (const item of batch) this.diagnostics.push({ filePath: item.filePath, stage: "parser", message: error.message });
        continue;
      }
      for (let i = 0; i < batch.length; i++) {
        if (!parsed[i] || parsed[i].error) {
          this.diagnostics.push({ filePath: batch[i].filePath, stage: "parser", message: parsed[i]?.error || "Missing Python result" });
          continue;
        }
        const { imports, exports, classes, routes, functions, ...rest } =
          parsed[i] || {};
        results.push({
          filePath: batch[i].filePath,
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

    this.failureCount = this.diagnostics.filter(d => d.severity !== "warning").length;
    resolveRoutes(results);
    for (const file of results) {
      for (const message of file.routeDiagnostics || []) {
        this.diagnostics.push({ filePath: file.filePath, stage: "routes", severity: "warning", message });
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
