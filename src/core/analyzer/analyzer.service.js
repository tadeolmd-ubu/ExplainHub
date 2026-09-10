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
  async analyze(input, format = "txt", language = "en", options = {}) {
    let projectPath = input;
    const cloner = new RepositoryCloner();
    let result = null;

    if (input.endsWith(".zip")) {
      result = await cloner.extractZip(input);
      projectPath = result.repoPath;
    } else if (
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
    }

    const sizeResult = await validateRepositorySize(projectPath);
    if (!sizeResult.safe) {
      if (result) await cloner.cleanup(result.tempPath);
      throw new Error(sizeResult.reason);
    }

    try {
      const extractor = new StructureExtractor();
      const { tree, technologies, entryPoints } =
        await extractor.extract(projectPath);
      const parser = new CodeParser();
      const files = await parser.parse(tree, projectPath);
      const generator = new TextGenerator();
      const diagnostics = [...parser.diagnostics];
      const metadata = { diagnostics, skippedFiles: parser.skippedFiles, parserFailures: parser.diagnostics.length, aiUsed: false };
      const useAi = options.ai !== false && Boolean(config.ollama.model);

      if (format === "md") {
        const { readme, modules } = generator.generate({
          technologies,
          entryPoints,
          files,
          tree,
          projectPath,
          format: "md",
          language,
        });

        let finalReadme = readme;
        let finalModules = modules;

        if (useAi) {
          const enhancer = new AiEnhancer();
          console.log("Mejorando README con IA...");
          try {
            finalReadme = await enhancer.enhanceMarkdown(readme, language);
            metadata.aiUsed = true;
            console.log("✓ README mejorado");
          } catch (e) {
            diagnostics.push({ stage: "ai", message: e.message });
            finalReadme = readme;
          }
          finalModules = [];

          const total = modules.length;
          for (let i = 0; i < total; i++) {
            const mod = modules[i];
            console.log(`  [${i + 1}/${total}] Mejorando ${mod.name}...`);
            try {
              const content = await enhancer.enhanceMarkdown(
                mod.content,
                language,
              );
              finalModules.push({ ...mod, content });
              metadata.aiUsed = true;
            } catch (e) {
              diagnostics.push({ stage: "ai", filePath: mod.name, message: e.message });
              finalModules.push({ ...mod, content: mod.content });
            }
          }
        }
        const written = await writeDocs({
          projectPath,
          readme: finalReadme,
          modules: finalModules,
        });
        return {
          ...metadata,
          summary: `Document generated: ${written} files`,
          repoPath: projectPath,
        };
      }

      const plainText = generator.generate({
        technologies,
        entryPoints,
        files,
        language,
      });
      if (!useAi) return { ...metadata, summary: plainText, repoPath: projectPath };
      try {
        const enhancer = new AiEnhancer();
        const summary = await enhancer.enhance(plainText, format, language);
        return { ...metadata, aiUsed: true, summary, repoPath: projectPath };
      } catch (err) {
        diagnostics.push({ stage: "ai", message: err.message });
        return { ...metadata, summary: plainText, repoPath: projectPath };
      }
    } finally {
      if (result && input.endsWith(".zip"))
        await cloner.cleanup(result.tempPath);
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
