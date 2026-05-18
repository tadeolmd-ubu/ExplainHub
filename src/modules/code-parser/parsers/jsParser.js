import parser from "@babel/parser";
import { extractImports } from "../extractors/importExtractor.js";
import { extractExports } from "../extractors/exportsExtractor.js";
import { extractClasses } from "../extractors/classExtractor.js";
import { extractRoutes } from "../extractors/routesExtractor.js";
import { extractFunctions } from "../extractors/functionExtractor.js";

export function parseJavaScript(content) {
  const ast = parser.parse(content, {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    plugins: ["dynamicImport"],
  });
  return {
    imports: extractImports(ast),
    exports: extractExports(ast),
    classes: extractClasses(ast),
    routes: extractRoutes(ast),
    functions: extractFunctions(ast),
  };
}
