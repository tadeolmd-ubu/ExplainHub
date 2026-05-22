import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import { RepositoryCloner } from "../src/modules/cloner/index.js";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import { CodeParser } from "../src/modules/code-parser/index.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";
import { AiEnhancer } from "../src/modules/ai-enhancer/index.js";
//test("", async() =>{})

//==========CLONER==========//
test("should clone repo and return repoPath", async () => {
  const cloner = new RepositoryCloner();
  const result = await cloner.clone(
    "https://github.com/tadeolmd-ubu/ExplainHub.git",
  );
  assert.ok(result.repoPath);
  assert.ok(result.tempPath);
  assert.equal(typeof result.repoPath, "string");
  await cloner.cleanup(result.tempPath);
});
//==========STRUCTURE EXTRACTOR==========//
test("should return tree, technologies and entryPoints", async () => {
  const structureExtractor = new StructureExtractor();
  const result = await structureExtractor.extract(".");
  assert.ok(result.tree);
  assert.ok(result.technologies);
  assert.ok(result.entryPoints);
});
//==========CODE PARSER==========//
test("should return 'files[]' whith: imports, exports, functions, etc...", async () => {
  const structureExtractor = new StructureExtractor();
  const { tree } = await structureExtractor.extract(".");
  const codeParser = new CodeParser();
  const files = await codeParser.parse(tree, ".");
  assert.ok(Array.isArray(files));
  assert.ok(files.length > 0);
  assert.ok(files[0].filePath);
  assert.ok(files[0].imports);
  assert.ok(files[0].exports);
  assert.ok(files[0].functions);
});
//==========TEXT GENERATOR==========//
test("should generate plain text with sections (header,stats, etc...)", async () => {
  const textGenerator = new TextGenerator();
  const structureExtractor = new StructureExtractor();
  const codeParser = new CodeParser();
  const { technologies, entryPoints, tree } =
    await structureExtractor.extract(".");
  const files = await codeParser.parse(tree, ".");
  const text = textGenerator.generate({ technologies, entryPoints, files });
  assert.equal(typeof text, "string");
  assert.ok(text.length > 0);
});

//==========CLONER==========//
//==========NEED OLLAMA==========//
test("should return a string whith the recap of the project", async () => {
  const textGenerator = new TextGenerator();
  const structureExtractor = new StructureExtractor();
  const codeParser = new CodeParser();
  const { technologies, entryPoints, tree } =
    await structureExtractor.extract(".");
  const files = await codeParser.parse(tree, ".");
  const text = textGenerator.generate({ technologies, entryPoints, files });
  const aiEnhancer = new AiEnhancer();
  const result = await aiEnhancer.enhance(text);
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0);
});
