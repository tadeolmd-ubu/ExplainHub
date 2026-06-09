import test from "node:test";
import assert from "node:assert/strict";

import { RepositoryCloner } from "../src/modules/cloner/index.js";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import { CodeParser } from "../src/modules/code-parser/index.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";
import { AiEnhancer } from "../src/modules/ai-enhancer/index.js";

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
test("MODULES, should contain name, content, and excepted sections", async () => {
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
