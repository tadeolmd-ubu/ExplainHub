import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createZip } from "./helpers/zip.js";
import { AnalyzerService } from "../src/core/analyzer/analyzer.service.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";

test("Markdown preserves source docs and ZIP artifacts survive cleanup", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "report-output-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const previousModel = process.env.OLLAMA_MODEL;
  delete process.env.OLLAMA_MODEL;
  t.after(() => { if (previousModel !== undefined) process.env.OLLAMA_MODEL = previousModel; });
  const project = path.join(root, "project");
  await fs.mkdir(project);
  await fs.writeFile(path.join(project, "README.md"), "Handwritten documentation");
  await fs.writeFile(path.join(project, "index.js"), "export const value = 1;");
  const outputDir = path.join(root, "output");
  const service = new AnalyzerService();
  const local = await service.analyze(project, "md", "en", { outputDir });
  assert.equal(await fs.readFile(path.join(project, "README.md"), "utf8"), "Handwritten documentation");
  assert.ok(local.outputPaths.length >= 2, "root files are documented");
  const archive = path.join(root, "source.ZIP");
  await createZip(archive, { "index.js": "export const value = 1;" });
  const zipped = await service.analyze(archive, "md", "en", { outputDir });
  assert.equal(zipped.repoPath, null);
  const zippedTxt = await service.analyze(archive, "txt", "es", { ai: false });
  assert.equal(zippedTxt.repoPath, null);
  for (const target of zipped.outputPaths) await fs.access(target);
  const again = await service.analyze(project, "md", "en", { outputDir });
  assert.notEqual(again.outputDir, local.outputDir);
});

test("metadata never follows a package.json symlink", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "metadata-link-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "project"));
  await fs.writeFile(path.join(root, "outside.json"), JSON.stringify({ description: "outside-secret" }));
  await fs.symlink(path.join(root, "outside.json"), path.join(root, "project", "package.json"));
  const { readme } = new TextGenerator().generate({ files: [], technologies: [], entryPoints: {}, projectPath: path.join(root, "project"), format: "md" });
  assert.ok(!readme.includes("outside-secret"));
});

test("module links are unique and generated commands require evidence", () => {
  const files = ["a/shared/utils/a.js", "b/shared/utils/b.js", "main.js"].map(f => ({
    filePath: path.join("/project", f), type: "javascript", functions: [], exports: [], classes: [], routes: [],
  }));
  const result = new TextGenerator().generate({ files, technologies: ["node"], entryPoints: {}, projectPath: "/project", format: "md" });
  assert.equal(new Set(result.modules.map(m => m.name)).size, 3);
  for (const mod of result.modules) assert.ok(result.readme.includes(`docs/${mod.name}.md`));
  assert.ok(!result.readme.includes("npm start"));
  assert.ok(result.readme.includes("No verified startup command"));
});
