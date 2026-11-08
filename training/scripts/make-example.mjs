#!/usr/bin/env node
/**
 * Regenerate training/data/example.jsonl from the committed sample pair.
 *
 * The sample exists so a new contributor can see the exact row shape without
 * building a dataset first. It uses the real production prompt builder, not a
 * hand-written approximation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMdEnhancer } from "../../src/modules/ai-enhancer/prompt/promptMdEnhancer.js";
import { checkCorrection } from "./lib/markdown-contract.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TRAINING_DIR = path.resolve(SCRIPT_DIR, "..");
const PAIR_DIR = path.join(TRAINING_DIR, "datasets/pairs/example-demo");
const OUT_FILE = path.join(TRAINING_DIR, "data/example.jsonl");

const documents = ["README.md", "docs/src.md"];
const rows = [];

for (const relative of documents) {
  const raw = fs.readFileSync(path.join(PAIR_DIR, "raw", relative), "utf8");
  const corrected = fs
    .readFileSync(path.join(PAIR_DIR, "corrected", relative), "utf8")
    .replace(/\r\n/g, "\n")
    .trimEnd();

  const check = checkCorrection(raw, corrected, {
    kind: relative.startsWith("docs/") ? "module" : "readme",
  });
  if (!check.ok) {
    console.error(`Sample pair is invalid: ${relative}`);
    for (const error of check.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    continue;
  }

  rows.push({
    messages: [
      { role: "user", content: buildMdEnhancer(raw, "en") },
      { role: "assistant", content: corrected },
    ],
  });
}

if (process.exitCode) process.exit(process.exitCode);

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(
  OUT_FILE,
  `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
  "utf8",
);

console.log(`Wrote ${rows.length} rows to ${path.relative(process.cwd(), OUT_FILE)}`);
