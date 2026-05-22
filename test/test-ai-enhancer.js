import "dotenv/config";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import CodeParser from "../src/modules/code-parser/index.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";
import { AiEnhancer } from "../src/modules/ai-enhancer/index.js";

async function run() {
  const projectPath = process.argv[2] || process.cwd();

  console.log("Project path:", projectPath);
  console.log("Model:", process.env.OLLAMA_MODEL || "qwen3.5");
  console.log("---\n");

  const extractor = new StructureExtractor();
  const { tree, technologies, entryPoints } = await extractor.extract(projectPath);

  const parser = new CodeParser();
  const files = await parser.parse(tree, projectPath);

  const generator = new TextGenerator();
  const plainText = generator.generate({ technologies, entryPoints, files });

  const enhancer = new AiEnhancer();
  const summary = await enhancer.enhance(plainText);

  console.log(summary);
}

run().catch((error) => {
  console.error("\nError:", error);
  process.exitCode = 1;
});
