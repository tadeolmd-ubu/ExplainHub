import test from "node:test";
import assert from "node:assert/strict";
import { postProcess } from "../src/modules/ai-enhancer/index.js";

//==========POST PROCESS==========//
test("postProcess - returns string with newline", () => {
  const result = postProcess("# Title\n\nContent here");
  assert.equal(typeof result, "string");
  assert.ok(result.endsWith("\n"));
});

test("postProcess - removes trailing prose after tables", () => {
  const input = `# Section

| Name | Value |
|------|-------|
| foo  | bar   |

This trailing prose should be removed`;
  const result = postProcess(input, input);
  assert.ok(!result.includes("trailing prose"));
  assert.ok(result.includes("foo"));
});

test("postProcess - cleans unclosed code fences", () => {
  const input = "```markdown\n# Title\n```";
  const result = postProcess(input, "");
  const fenceCount = (result.match(/```/g) || []).length;
  assert.equal(fenceCount % 2, 0);
});

test("postProcess - reduces triple newlines to double", () => {
  const input = "Line 1\n\n\n\nLine 2";
  const result = postProcess(input, "");
  assert.ok(!result.includes("\n\n\n"));
});

//==========ALIGN SECTIONS (via postProcess)==========//
test("postProcess - preserves original section order", () => {
  const original = `# Title

## Overview
Original overview content

## Modules
Original modules table`;
  const aiOutput = `# Title

## Modules
Enhanced modules content

## Overview
Enhanced overview content`;
  const result = postProcess(aiOutput, original);
  const overviewIdx = result.indexOf("## Overview");
  const modulesIdx = result.indexOf("## Modules");
  assert.ok(overviewIdx < modulesIdx, "Overview should come before Modules");
});

test("postProcess - uses AI content when available", () => {
  const original = `# Title

## Overview
Original content`;
  const aiOutput = `# Title

## Overview
| Feature | Status |
|---------|--------|
| auth    | done   |`;
  const result = postProcess(aiOutput, original);
  assert.ok(result.includes("auth"));
  assert.ok(result.includes("done"));
});

test("postProcess - falls back to original when AI has no content", () => {
  const original = `# Title

## Overview
Original overview text

## Modules
| Name | File |
|------|------|
| mod1 | mod1.js |`;
  const aiOutput = `# Title

## Modules
| Name | File |
|------|------|
| mod1 | mod1.js |`;
  const result = postProcess(aiOutput, original);
  assert.ok(result.includes("Original overview text"));
});

test("postProcess - normalizes table separators", () => {
  const input = `# Title

| Name | Value |
|------|-------|
| foo  | bar   |`;
  const result = postProcess(input, input);
  assert.ok(result.includes("|"));
  assert.ok(result.includes("------"));
});

test("postProcess - dedupes rows in Exports section", () => {
  const original = `# Title

## Exports
| Name | Kind | File |
|------|------|------|
| foo  | func | a.js |`;
  const aiOutput = `# Title

## Exports
| Name | Kind | File |
|------|------|------|
| foo  | func | a.js |
| foo  | func | a.js |`;
  const result = postProcess(aiOutput, original);
  const fooCount = (result.match(/^\| foo/gm) || []).length;
  assert.equal(fooCount, 1);
});
