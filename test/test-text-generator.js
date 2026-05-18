import path from "node:path";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import CodeParser from "../src/modules/code-parser/index.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";

async function run() {
  const projectPath = process.argv[2] || process.cwd();

  console.log("Project path:", projectPath);

  const extractor = new StructureExtractor();
  const { tree, technologies, entryPoints } = await extractor.extract(projectPath);

  const parser = new CodeParser();
  const files = await parser.parse(tree, projectPath);

  const generator = new TextGenerator();
  const output = generator.generate({ technologies, entryPoints, files });

  console.log(output);
}

run().catch((error) => {
  console.error("Test failed:", error);
  process.exitCode = 1;
});
