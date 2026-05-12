import path from "node:path";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import CodeParser from "../src/modules/code-parser/index.js";

async function run() {
  const projectPath = process.argv[2] || process.cwd();

  console.log("Project path:", projectPath);

  // 1. Obtener estructura del proyecto
  const extractor = new StructureExtractor();
  const { tree, technologies } = await extractor.extract(projectPath);

  console.log("\nTechnologies detected:", technologies);
  console.log("\n---");

  // 2. Parsear archivos
  const parser = new CodeParser();
  const results = await parser.parse(tree, projectPath);

  console.log(`Parsed ${results.length} files:\n`);

  // 3. Mostrar resultados por archivo
  for (const file of results) {
    console.log("File:", file.filePath);
    console.log("  Type:", file.type);
    if (file.exports?.length) {
      console.log("  Exports:", file.exports.map((e) => e.name).join(", "));
    }
    if (file.imports?.length) {
      console.log("  Imports:", file.imports.map((i) => i.source).join(", "));
    }
    if (file.functions?.length) {
      console.log(
        "  Functions:",
        file.functions.map((f) => `${f.name} (${f.kind})`).join(", ")
      );
    }
    if (file.classes?.length) {
      console.log(
        "  Classes:",
        file.classes.map((c) => c.name).join(", ")
      );
    }
    if (file.routes?.length) {
      console.log(
        "  Routes:",
        file.routes.map((r) => `${r.method} ${r.path}`).join(", ")
      );
    }
    console.log("");
  }

  // 4. Validaciones básicas
  const totalExports = results.reduce((sum, f) => sum + (f.exports?.length || 0), 0);
  const totalFunctions = results.reduce((sum, f) => sum + (f.functions?.length || 0), 0);
  const totalClasses = results.reduce((sum, f) => sum + (f.classes?.length || 0), 0);
  const totalImports = results.reduce((sum, f) => sum + (f.imports?.length || 0), 0);
  const totalRoutes = results.reduce((sum, f) => sum + (f.routes?.length || 0), 0);

  console.log("--- Summary ---");
  console.log(`Files parsed: ${results.length}`);
  console.log(`Total exports: ${totalExports}`);
  console.log(`Total imports: ${totalImports}`);
  console.log(`Total functions: ${totalFunctions}`);
  console.log(`Total classes: ${totalClasses}`);
  console.log(`Total routes: ${totalRoutes}`);
}

run().catch((error) => {
  console.error("Test failed:", error);
  process.exitCode = 1;
});
