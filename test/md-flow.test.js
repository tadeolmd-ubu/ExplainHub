import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import { CodeParser } from "../src/modules/code-parser/index.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";

test("Markdown flow documents an isolated project and its actual startup script", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "md-flow-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "src"));
  await fs.writeFile(path.join(root, "src", "index.js"), "export function greet() { return 'hello'; }");
  const structure = await new StructureExtractor().extract(root);
  const files = await new CodeParser().parse(structure.tree, root);
  const generator = new TextGenerator();
  const bare = generator.generate({ ...structure, files, projectPath: root, format: "md" });
  assert.ok(bare.readme.startsWith(`# ${path.basename(root)}\n`));
  assert.ok(bare.readme.includes("## Project Structure"));
  assert.ok(bare.modules[0].content.includes("greet"));
  assert.ok(bare.readme.includes(`docs/${bare.modules[0].name}.md`));
  assert.ok(!bare.readme.includes("npm start"));
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ scripts: { dev: "node src/index.js" }, dependencies: { express: "^5.0.0" } }));
  const configured = generator.generate({ ...structure, files, projectPath: root, format: "md" });
  assert.ok(configured.readme.includes("npm run dev"));
  assert.ok(configured.readme.includes("express"));
  assert.ok(!configured.readme.includes("npm start"));
});
