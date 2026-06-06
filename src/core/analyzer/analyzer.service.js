import { RepositoryCloner } from "../../modules/cloner/index.js";
import { StructureExtractor } from "../../modules/structure-extractor/index.js";
import { CodeParser } from "../../modules/code-parser/index.js";
import { TextGenerator } from "../../modules/text-generator/index.js";
import { AiEnhancer } from "../../modules/ai-enhancer/index.js";
import {
  validatePath,
  validateRepositorySize,
} from "../../modules/security/index.js";

import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../config/env.js";

export class AnalyzerService {
  async analyze(input, format = "txt") {
    let projectPath = input;
    const cloner = new RepositoryCloner();
    let result = null;
    if (
      input.startsWith("http://") ||
      input.startsWith("https://") ||
      input.startsWith("git@") ||
      input.startsWith("git://")
    ) {
      result = await cloner.clone(input);
      projectPath = result.repoPath;
    } else {
      const { safe, reason } = validatePath(input);
      if (!safe) throw new Error(reason);
      const sizeResult = await validateRepositorySize(projectPath);
      if (!sizeResult.safe) throw new Error(sizeResult.reason);
    }
    const extractor = new StructureExtractor();
    const { tree, technologies, entryPoints } =
      await extractor.extract(projectPath);
    const parser = new CodeParser();
    const files = await parser.parse(tree, projectPath);
    const generator = new TextGenerator();

    if (format === "md") {
      if (result)
        return {
          summary:
            "Markdown docs only supported for local paths, not remote repos",
        };

      const { readme, modules } = generator.generate({
        technologies,
        entryPoints,
        files,
        tree,
        projectPath,
        format: "md",
      });

      let finalReadme = readme;
      let finalModules = modules;

      if (config.ollama.model) {
        const enhancer = new AiEnhancer();

        console.log("Mejorando README con IA...");
        finalReadme = await enhancer.enhanceMarkdown(readme);

        console.log(
          `Mejorando ${modules.length} módulos con IA, uno a la vez...`,
        );
        finalModules = [];

        for (const mod of modules) {
          console.log(`  Mejorando ${mod.name}...`);
          const content = await enhancer.enhanceMarkdown(mod.content);
          finalModules.push({ ...mod, content });
        }
      }
      const written = await writeDocs({
        projectPath,
        readme: finalReadme,
        modules: finalModules,
      });
      return { summary: `Document generated: ${written} files` };
    }

    const plainText = generator.generate({ technologies, entryPoints, files });
    try {
      const enhancer = new AiEnhancer();
      const summary = await enhancer.enhance(plainText, format);
      return { summary };
    } catch (err) {
      console.error("AI Enhancer error:", err.message);
      return { summary: plainText };
    } finally {
      if (result) await cloner.cleanup(result.tempPath);
    }
  }
}

async function writeDocs({ projectPath, readme, modules }) {
  const docsDir = path.join(projectPath, "docs");
  await fs.mkdir(docsDir, { recursive: true });
  await fs.writeFile(path.join(projectPath, "README.md"), readme);
  for (const mod of modules) {
    await fs.writeFile(path.join(docsDir, `${mod.name}.md`), mod.content);
  }
  return modules.length + 1;
}
