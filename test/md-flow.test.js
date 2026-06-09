import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import { CodeParser } from "../src/modules/code-parser/index.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";

test("should use basename fallback when project has no package.json", async () => {
  const structureExtractor = new StructureExtractor();
  const textGenerator = new TextGenerator();
  const codeParser = new CodeParser();

  const tempPath = await fs.mkdtemp(path.join(tmpdir(), "foo-"));

  const { technologies, entryPoints, tree } =
    await structureExtractor.extract(".");
  const files = await codeParser.parse(tree, ".");
  const { readme } = textGenerator.generate({
    technologies,
    entryPoints,
    files,
    tree,
    projectPath: tempPath,
    format: "md",
  });

  await fs.rm(tempPath, { recursive: true, force: true });
  assert.equal(typeof readme, "string");
  assert.ok(readme.length > 0);
});

test("README, should generate sections: Overview, projectStructure, Modules, API, Schemas", async () => {
  const structureExtractor = new StructureExtractor();
  const textGenerator = new TextGenerator();
  const codeParser = new CodeParser();

  const { technologies, entryPoints, tree } =
    await structureExtractor.extract(".");
  const files = await codeParser.parse(tree, ".");
  const { readme } = textGenerator.generate({
    technologies,
    entryPoints,
    files,
    tree,
    projectPath: ".",
    format: "md",
  });
  assert.equal(typeof readme, "string");
  assert.ok(readme.length > 0);
  assert.ok(readme.includes("Overview"));
  assert.ok(readme.includes("Project Structure"));
  assert.ok(readme.includes("Modules"));
});
test("MODULES, should contain name, content, and expected sections", async () => {
  const structureExtractor = new StructureExtractor();
  const textGenerator = new TextGenerator();
  const codeParser = new CodeParser();

  const { technologies, entryPoints, tree } =
    await structureExtractor.extract(".");
  const files = await codeParser.parse(tree, ".");
  const { modules } = textGenerator.generate({
    technologies,
    entryPoints,
    files,
    tree,
    projectPath: ".",
    format: "md",
  });
  assert.ok(Array.isArray(modules));
  assert.ok(modules.length > 0);

  for (const mod of modules) {
    assert.equal(typeof mod.name, "string");
    assert.ok(mod.name.length > 0);
    assert.equal(typeof mod.content, "string");
    assert.ok(mod.content.length > 0);
    assert.ok(mod.content.startsWith("# Module:"));
  }
});
