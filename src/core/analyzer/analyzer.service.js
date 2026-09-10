import { RepositoryCloner } from "../../modules/cloner/index.js";
import { StructureExtractor } from "../../modules/structure-extractor/index.js";
import { CodeParser } from "../../modules/code-parser/index.js";
import { TextGenerator } from "../../modules/text-generator/index.js";
import { AiEnhancer } from "../../modules/ai-enhancer/index.js";
import {
  validateRepositorySize,
} from "../../modules/security/index.js";

import { writeDocs } from "../../modules/text-generator/writeDocs.js";
import { config } from "../../config/env.js";
import { normalizeSource, validateAnalysisOptions } from "../../modules/security/source.js";
import { validateRealPath } from "../../modules/security/pathValidator.js";

export class AnalyzerService {
  async analyze(input, format = "txt", language = "en", options = {}) {
    validateAnalysisOptions(format, language);
    const source = normalizeSource(input);
    input = source.value;
    let projectPath = input;
    const cloner = new RepositoryCloner();
    let result = null;

    if (source.type === "zip") {
      await validateRealPath(input);
      result = await cloner.extractZip(input);
      projectPath = result.repoPath;
    } else if (source.type === "remote") {
      result = await cloner.clone(input);
      projectPath = result.repoPath;
    } else {
      projectPath = await validateRealPath(input);
    }

    try {
      const sizeResult = await validateRepositorySize(projectPath);
      if (!sizeResult.safe) {
        throw Object.assign(new Error(sizeResult.reason), { status: 413 });
      }

      const extractor = new StructureExtractor();
      const { tree, technologies, entryPoints } =
        await extractor.extract(projectPath);
      const parser = new CodeParser();
      const files = await parser.parse(tree, projectPath);
      const generator = new TextGenerator();
      const diagnostics = [...parser.diagnostics];
      const metadata = { diagnostics, skippedFiles: parser.skippedFiles, parserFailures: parser.failureCount, aiUsed: false };
      const useAi = options.ai !== false && Boolean(config.ollama.model);

      if (format === "md") {
        const { readme, modules } = generator.generate({
          technologies,
          entryPoints,
          files,
          tree,
          projectPath,
          projectName: result?.cloneName,
          format: "md",
          language,
        });

        let finalReadme = readme;
        let finalModules = modules;

        if (useAi) {
          const enhancer = new AiEnhancer({ timeoutMs: Math.min(config.ollama.timeoutMs, 120000) });
          const deadline = Date.now() + 120000;
          let enhancementFailed = false;
          console.log("Mejorando README con IA...");
          try {
            finalReadme = await enhancer.enhanceMarkdown(readme, language);
            metadata.aiUsed = true;
            console.log("✓ README mejorado");
          } catch (e) {
            diagnostics.push({ stage: "ai", message: e.message });
            enhancementFailed = true;
            finalReadme = readme;
          }
          finalModules = [];

          const total = modules.length;
          for (let i = 0; i < total; i++) {
            const mod = modules[i];
            if (enhancementFailed || Date.now() >= deadline) {
              if (!enhancementFailed) diagnostics.push({ stage: "ai", message: "AI report time budget exhausted; remaining modules kept unchanged" });
              enhancementFailed = true;
              finalModules.push(mod);
              continue;
            }
            enhancer.timeoutMs = Math.min(config.ollama.timeoutMs, deadline - Date.now());
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
              enhancementFailed = true;
              finalModules.push({ ...mod, content: mod.content });
            }
          }
        }
        const written = await writeDocs({
          projectPath,
          readme: finalReadme,
          modules: finalModules,
          outputDir: options.outputDir,
        });
        return {
          ...metadata,
          summary: `Document generated: ${written.outputPaths.length} files`,
          repoPath: source.type === "zip" ? null : projectPath,
          ...written,
        };
      }

      const plainText = generator.generate({
        technologies,
        entryPoints,
        files,
        language,
      });
      const repoPath = source.type === "zip" ? null : projectPath;
      if (!useAi) return { ...metadata, summary: plainText, repoPath };
      try {
        const enhancer = new AiEnhancer();
        const summary = await enhancer.enhance(plainText, format, language);
        return { ...metadata, aiUsed: true, summary, repoPath };
      } catch (err) {
        diagnostics.push({ stage: "ai", message: err.message });
        return { ...metadata, summary: plainText, repoPath };
      }
    } catch (error) {
      if (result && source.type === "remote") await cloner.cleanup(result.tempPath);
      throw error;
    } finally {
      if (result && source.type === "zip")
        await cloner.cleanup(result.tempPath);
    }
  }
}
