import { RepositoryCloner } from "../../modules/cloner/index.js";
import { StructureExtractor } from "../../modules/structure-extractor/index.js";
import CodeParser from "../../modules/code-parser/index.js";
import { TextGenerator } from "../../modules/text-generator/index.js";
import { AiEnhancer } from "../../modules/ai-enhancer/index.js";

export class AnalyzerService {
  async analyze(input) {
    let projectPath = input;

    if (
      input.startsWith("http://") ||
      input.startsWith("https://") ||
      input.startsWith("git@") ||
      input.startsWith("git://")
    ) {
      const cloner = new RepositoryCloner();
      const result = await cloner.clone(input);
      projectPath = result.repoPath;
    }

    const extractor = new StructureExtractor();
    const { tree, technologies, entryPoints } =
      await extractor.extract(projectPath);
    const parser = new CodeParser();
    const files = await parser.parse(tree, projectPath);
    const generator = new TextGenerator();
    const plainText = generator.generate({ technologies, entryPoints, files });
    try {
      const enhancer = new AiEnhancer();
      const summary = await enhancer.enhance(plainText);
      return { summary, plainText, technologies, files };
    } catch {
      return { summary: plainText, plainText, technologies, files };
    }
  }
}
