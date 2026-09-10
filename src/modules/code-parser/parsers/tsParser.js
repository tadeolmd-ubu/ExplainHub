import parser from "@babel/parser";
import { extractImports } from "../extractors/importExtractor.js";
import { extractExports } from "../extractors/exportsExtractor.js";
import { extractClasses } from "../extractors/classExtractor.js";
import { analyzeExpress } from "../extractors/routesExtractor.js";
import { extractFunctions } from "../extractors/functionExtractor.js";

export function parseTypeScript(content) {
  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  return {
    imports: extractImports(ast),
    exports: extractExports(ast),
    classes: extractClasses(ast),
    ...analyzeExpress(ast),
    functions: extractFunctions(ast),
  };
}
