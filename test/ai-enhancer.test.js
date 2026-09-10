import test from "node:test";
import assert from "node:assert/strict";
import { AiEnhancer, postProcess } from "../src/modules/ai-enhancer/index.js";

test("postProcess preserves final prose, repeated headings, tables and code", () => {
  const input = "# Title\n\n## Views\n- first\n\n## Views\n- second\n\n```js\nconst a = 1;\n```\n\nImportant explanation";
  assert.equal(postProcess(input), input + "\n");
  assert.equal(postProcess("", input), input + "\n");
});

test("Markdown enhancement preserves every original fact and honors the language", async () => {
  const input = "# Title\n\n## Functions\n| Name |\n|------|\n| foo |\n\nFinal paragraph";
  const client = { async *generate(options) {
    assert.ok(options.prompt.includes("español"));
    yield { response: JSON.stringify({ description: "Una descripción comprobable." }) };
  } };
  const output = await new AiEnhancer({ client, model: "test" }).enhanceMarkdown(input, "es");
  assert.ok(output.includes("Descripción generada por IA"));
  assert.ok(output.endsWith(input.slice(input.indexOf("## Functions")) + "\n"));
});

test("AI timeout aborts a stalled client", async () => {
  let aborted = false;
  const client = { generate: () => new Promise(() => {}), abort: () => { aborted = true; } };
  await assert.rejects(new AiEnhancer({ client, model: "test", timeoutMs: 15 }).enhance("text"), /timed out/);
  assert.equal(aborted, true);
});

test("AI rejects empty and invalid structured output instead of replacing docs", async () => {
  const client = { async *generate() { yield { response: "{}" }; } };
  await assert.rejects(new AiEnhancer({ client, model: "test" }).enhanceMarkdown("# Title"), /missing/);
  const empty = { async *generate() {} };
  await assert.rejects(new AiEnhancer({ client: empty, model: "test" }).enhance("text"), /empty/);
});
