#!/usr/bin/env node
/**
 * Measure the fine-tuned model against the base model on held-out repositories.
 *
 * Both models receive the exact production prompt stored in eval.jsonl. The
 * only difference is the model name. Outputs are post-processed with the same
 * stripCodeBlock + postProcess path used by AiEnhancer.enhanceMarkdown, so the
 * comparison reflects production behaviour.
 *
 * Usage:
 *   node training/scripts/evaluate.mjs \
 *     --base llama3:8b \
 *     --tuned explainhub-docs \
 *     --limit 20
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { postProcess, stripCodeBlock } from "../../src/modules/ai-enhancer/index.js";
import {
  averageMetrics,
  formatNumber,
  formatPercent,
  scoreRow,
} from "./lib/metrics.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TRAINING_DIR = path.resolve(SCRIPT_DIR, "..");

function usage() {
  console.log(`ExplainHub fine-tune evaluation

Usage:
  node training/scripts/evaluate.mjs [options]

Options:
  --eval <path>     ChatML rows with the production prompt (default: training/data/eval.jsonl)
  --refs <path>     Sidecar with raw and corrected docs (default: training/data/eval-ref.jsonl)
  --base <model>    Base Ollama model (default: llama3:8b)
  --tuned <model>   Fine-tuned Ollama model (default: explainhub-docs)
  --host <url>      Ollama base URL (default: OLLAMA_URL or http://localhost:11434)
  --limit <n>       Evaluate only the first n rows (0 = all, default: 0)
  --out <prefix>    Output prefix (default: training/data/eval-report)
  --timeout <ms>    Per-request timeout (default: 300000)
  --help            Show this message`);
}

function parseArgs(argv) {
  const options = {
    eval: path.join(TRAINING_DIR, "data/eval.jsonl"),
    refs: path.join(TRAINING_DIR, "data/eval-ref.jsonl"),
    base: "llama3:8b",
    tuned: "explainhub-docs",
    host: process.env.OLLAMA_URL || "http://localhost:11434",
    limit: 0,
    out: path.join(TRAINING_DIR, "data/eval-report"),
    timeout: 300000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    switch (arg) {
      case "--eval":
        options.eval = path.resolve(next());
        break;
      case "--refs":
        options.refs = path.resolve(next());
        break;
      case "--base":
        options.base = next();
        break;
      case "--tuned":
        options.tuned = next();
        break;
      case "--host":
        options.host = next().replace(/\/$/, "");
        break;
      case "--limit":
        options.limit = Number(next());
        if (!Number.isInteger(options.limit) || options.limit < 0) {
          throw new Error("--limit must be a non-negative integer");
        }
        break;
      case "--out":
        options.out = path.resolve(next());
        break;
      case "--timeout":
        options.timeout = Number(next());
        if (!Number.isFinite(options.timeout) || options.timeout <= 0) {
          throw new Error("--timeout must be a positive number of milliseconds");
        }
        break;
      case "--help":
      case "-h":
        usage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

async function readJsonl(filePath) {
  const text = await fsp.readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1}: ${error.message}`);
      }
    });
}

async function generate({ host, model, prompt, timeout }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // Stream the response. Node's fetch (undici) aborts a request that has not
    // received response headers after 5 minutes. Generation with a non-streaming
    // request sends headers only when the whole document is ready, so the tuned
    // model hit UND_ERR_HEADERS_TIMEOUT on slower GPUs. Streaming sends chunks
    // as they are produced and keeps the connection alive.
    const response = await fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        think: false,
        options: {
          temperature: 0,
          seed: 42,
          // Ollama's default context is 4096, but a production prompt is
          // ~1.8k tokens and a corrected document adds another ~2k.
          num_ctx: 8192,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Ollama ${response.status} for model "${model}": ${body.slice(0, 300)}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error(`Ollama error: ${chunk.error}`);
        if (chunk.response) text += chunk.response;
      }
    }

    if (buffer.trim()) {
      const chunk = JSON.parse(buffer);
      if (chunk.error) throw new Error(`Ollama error: ${chunk.error}`);
      if (chunk.response) text += chunk.response;
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

function extractPrompt(row) {
  if (!Array.isArray(row.messages)) return null;
  const user = row.messages.find((message) => message.role === "user");
  return user ? user.content : null;
}

function markdownTable(summary) {
  const rows = [
    ["Composite score", "composite", "percent"],
    ["Headings kept", "headingsMatch", "percent"],
    ["Section recall", "sectionRecall", "percent"],
    ["File table rows kept", "fileTableRowsMatch", "percent"],
    ["File name Jaccard", "fileNameJaccard", "percent"],
    ["Modules table rows kept", "modulesTableRowsMatch", "percent"],
    ["Exports not inflated", "exportsNotIncreased", "percent"],
    ["Description present", "descriptionPresent", "percent"],
    ["Content fidelity", "contentFidelity", "percent"],
    ["Invented file names", "inventedFiles", "number"],
    ["Latency (ms)", "latencyMs", "number"],
    ["Output chars", "candidateChars", "number"],
  ];

  const format = (value, kind) =>
    kind === "percent" ? formatPercent(value) : formatNumber(value);

  const base = summary.base;
  const tuned = summary.tuned;
  const lines = [
    "| Metric | Base | Tuned | Delta |",
    "|--------|------|-------|-------|",
  ];

  for (const [label, key, kind] of rows) {
    const left = base[key];
    const right = tuned[key];
    const delta =
      typeof left === "number" && typeof right === "number" ? right - left : null;
    const deltaText =
      delta === null
        ? "—"
        : kind === "percent"
          ? `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)} pp`
          : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
    lines.push(
      `| ${label} | ${format(left, kind)} | ${format(right, kind)} | ${deltaText} |`,
    );
  }

  return lines.join("\n");
}

async function evaluateModel(model, rows, refs, options) {
  const results = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const ref = refs[index];
    if (!ref) throw new Error(`Missing eval ref for row ${index + 1}`);
    const prompt = extractPrompt(row);
    if (!prompt) throw new Error(`Row ${index + 1} has no user message`);

    process.stdout.write(
      `  [${index + 1}/${rows.length}] ${model} ${ref.id} ... `,
    );
    const started = Date.now();
    try {
      const response = await generate({
        host: options.host,
        model,
        prompt,
        timeout: options.timeout,
      });
      const cleaned = postProcess(stripCodeBlock(response), ref.raw);
      const metrics = scoreRow({
        raw: ref.raw,
        reference: ref.corrected,
        candidate: cleaned,
      });
      metrics.latencyMs = Date.now() - started;
      metrics.candidateChars = cleaned.length;
      results.push({
        id: ref.id,
        repo: ref.repo,
        doc: ref.doc,
        model,
        metrics,
        response: cleaned,
      });
      console.log(`composite ${formatPercent(metrics.composite)}`);
    } catch (error) {
      console.log(`FAILED: ${error.message}`);
      results.push({
        id: ref.id,
        repo: ref.repo,
        doc: ref.doc,
        model,
        error: error.message,
      });
    }
  }
  return results;
}

function summarize(results) {
  const ok = results.filter((row) => !row.error);
  return {
    ...averageMetrics(ok),
    errors: results.length - ok.length,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = await readJsonl(options.eval);
  const refs = await readJsonl(options.refs);

  if (rows.length === 0) {
    throw new Error(
      `${options.eval} is empty. Build the dataset from held-out repositories first.`,
    );
  }
  if (rows.length !== refs.length) {
    throw new Error(
      `eval.jsonl has ${rows.length} rows but eval-ref.jsonl has ${refs.length}. Rebuild the dataset.`,
    );
  }

  const limit =
    options.limit > 0 ? Math.min(options.limit, rows.length) : rows.length;
  const evalRows = rows.slice(0, limit);
  const evalRefs = refs.slice(0, limit);

  console.log(
    `Evaluating ${limit} held-out documents with ${options.base} and ${options.tuned}`,
  );
  console.log(`Ollama: ${options.host}\n`);

  const baseResults = await evaluateModel(
    options.base,
    evalRows,
    evalRefs,
    options,
  );
  console.log("");
  const tunedResults = await evaluateModel(
    options.tuned,
    evalRows,
    evalRefs,
    options,
  );

  const summary = {
    base: summarize(baseResults),
    tuned: summarize(tunedResults),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    host: options.host,
    base: options.base,
    tuned: options.tuned,
    rows: limit,
    summary,
    results: {
      base: baseResults,
      tuned: tunedResults,
    },
  };

  const jsonPath = `${options.out}.json`;
  const mdPath = `${options.out}.md`;
  await fsp.mkdir(path.dirname(jsonPath), { recursive: true });
  await fsp.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const delta = summary.tuned.composite - summary.base.composite;
  const markdown = [
    "# ExplainHub documentation enhancer — fine-tune evaluation",
    "",
    `- Date: ${report.generatedAt}`,
    `- Base model: \`${options.base}\``,
    `- Fine-tuned model: \`${options.tuned}\``,
    `- Held-out documents: ${limit}`,
    `- Composite delta: ${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)} percentage points`,
    "",
    markdownTable(summary),
    "",
    "## What the metrics mean",
    "",
    "- **Composite score** is the weighted mean of the structural and textual metrics below.",
    "- **Headings kept** compares the ordered heading sequence of the output with the human correction.",
    "- **Section recall** is the fraction of corrected headings that appear anywhere in the output.",
    "- **File table rows kept** and **Modules table rows kept** check the table shapes the prompt forbids changing.",
    "- **File name Jaccard** measures how many file names in the File Structure table match the correction.",
    "- **Exports not inflated** checks that the model did not add rows the prompt forbids.",
    "- **Description present** checks that README and module docs gained real prose, not just a table.",
    "- **Content fidelity** is the word-set Jaccard against the human correction (higher is closer to the target prose).",
    "- **Invented file names** counts files in the output that were not in the raw document or the correction.",
    "",
    "The per-document outputs are in the companion JSON file.",
    "",
  ].join("\n");

  await fsp.writeFile(mdPath, markdown, "utf8");

  console.log("");
  console.log(markdownTable(summary));
  console.log("");
  console.log(`Report: ${path.relative(process.cwd(), mdPath)}`);
  console.log(`Raw data: ${path.relative(process.cwd(), jsonPath)}`);

  if (summary.base.errors > 0 || summary.tuned.errors > 0) {
    console.error(
      `\n${summary.base.errors + summary.tuned.errors} request(s) failed. Check that both models exist in Ollama.`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\nevaluate failed: ${error.message}`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exitCode = 1;
});
