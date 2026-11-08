#!/usr/bin/env node
/**
 * Compare two Ollama models on the same raw Markdown documents when there are
 * no human corrections for the repository.
 *
 * The raw document is used as the structural reference: a good enhancer must
 * keep its headings, file table, module table and exports while improving the
 * prose. The "preservation" score below is scoreRow() with reference = raw, so
 * it measures how much of the input survived, not absolute quality.
 *
 * Usage:
 *   node training/scripts/compare-repo.mjs \
 *     --raw /tmp/explainhub-demo/learning-ts/raw \
 *     --models explainhub-docs,explainhub-docs-v2
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { postProcess, stripCodeBlock } from "../../src/modules/ai-enhancer/index.js";
import { buildMdEnhancer } from "../../src/modules/ai-enhancer/prompt/promptMdEnhancer.js";
import { formatNumber, formatPercent, scoreRow } from "./lib/metrics.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TRAINING_DIR = path.resolve(SCRIPT_DIR, "..");

function usage() {
  console.log(`Compare models on a raw Markdown directory

Usage:
  node training/scripts/compare-repo.mjs [options]

Options:
  --raw <dir>       Directory with raw Markdown documents (required)
  --models <list>   Comma-separated Ollama models (default: explainhub-docs,explainhub-docs-v2)
  --out <dir>       Output directory (default: training/results/<raw-name>-compare)
  --host <url>      Ollama base URL (default: OLLAMA_URL or http://localhost:11434)
  --limit <n>       Compare only the first n documents (0 = all, default: 0)
  --timeout <ms>    Per-request timeout (default: 1800000)
  --help            Show this message`);
}

function parseArgs(argv) {
  const options = {
    raw: null,
    models: "explainhub-docs,explainhub-docs-v2",
    out: null,
    host: process.env.OLLAMA_URL || "http://localhost:11434",
    limit: 0,
    timeout: 1800000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    switch (arg) {
      case "--raw":
        options.raw = path.resolve(next());
        break;
      case "--models":
        options.models = next();
        break;
      case "--out":
        options.out = path.resolve(next());
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

  if (!options.raw) throw new Error("--raw is required");
  options.models = options.models
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  if (options.models.length < 2) {
    throw new Error("--models needs at least two comma-separated models");
  }
  options.out = options.out ?? path.join(
    TRAINING_DIR,
    "results",
    `${path.basename(options.raw)}-compare`,
  );

  return options;
}

async function listMarkdown(dir) {
  const found = [];
  for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listMarkdown(full);
      found.push(...nested.map((item) => path.join(entry.name, item)));
    } else if (entry.name.endsWith(".md")) {
      found.push(entry.name);
    }
  }
  return found.sort();
}

async function generate({ host, model, prompt, timeout }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
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
          num_ctx: 8192,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Ollama ${response.status} for "${model}": ${body.slice(0, 300)}`,
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

function keyMetrics(row) {
  const m = row.metrics ?? {};
  return {
    preservation: m.composite,
    headings: m.headingsMatch,
    sectionRecall: m.sectionRecall,
    fileRows: m.fileTableRowsMatch,
    fileJaccard: m.fileNameJaccard,
    modulesRows: m.modulesTableRowsMatch,
    description: m.descriptionPresent,
    invented: m.inventedFiles,
    chars: m.candidateChars,
    latencyMs: m.latencyMs,
  };
}

function average(rows, key) {
  const values = rows
    .map((row) => row.metrics?.[key])
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const docs = await listMarkdown(options.raw);
  if (docs.length === 0) throw new Error(`No Markdown files in ${options.raw}`);

  const limit =
    options.limit > 0 ? Math.min(options.limit, docs.length) : docs.length;
  const selected = docs.slice(0, limit);

  console.log(
    `Comparing ${selected.length} raw documents with ${options.models.join(" vs ")}`,
  );
  console.log(`Ollama: ${options.host}\n`);

  const results = [];

  for (let index = 0; index < selected.length; index += 1) {
    const relative = selected[index];
    const raw = await fsp.readFile(path.join(options.raw, relative), "utf8");
    const prompt = buildMdEnhancer(raw);
    const row = { id: relative, metrics: {} };

    console.log(`[${index + 1}/${selected.length}] ${relative}`);

    for (const model of options.models) {
      process.stdout.write(`  ${model} ... `);
      const started = Date.now();
      try {
        const response = await generate({
          host: options.host,
          model,
          prompt,
          timeout: options.timeout,
        });
        const cleaned = postProcess(stripCodeBlock(response), raw);
        const metrics = scoreRow({ raw, reference: raw, candidate: cleaned });
        metrics.latencyMs = Date.now() - started;
        metrics.candidateChars = cleaned.length;
        row.metrics[model] = metrics;

        const outPath = path.join(options.out, model, relative);
        await fsp.mkdir(path.dirname(outPath), { recursive: true });
        await fsp.writeFile(outPath, `${cleaned}\n`, "utf8");

        console.log(
          `preservation ${formatPercent(metrics.composite)}, invented ${metrics.inventedFiles}`,
        );
      } catch (error) {
        console.log(`FAILED: ${error.message}`);
        row.metrics[model] = { error: error.message };
      }
    }

    results.push(row);
  }

  const summaryRows = [
    ["Preservation", "composite", "percent"],
    ["Headings kept", "headingsMatch", "percent"],
    ["Section recall", "sectionRecall", "percent"],
    ["File table rows kept", "fileTableRowsMatch", "percent"],
    ["File name Jaccard", "fileNameJaccard", "percent"],
    ["Modules table rows kept", "modulesTableRowsMatch", "percent"],
    ["Description present", "descriptionPresent", "percent"],
    ["Invented file names", "inventedFiles", "number"],
    ["Output chars", "candidateChars", "number"],
    ["Latency (ms)", "latencyMs", "number"],
  ];

  const modelAverages = {};
  for (const model of options.models) {
    modelAverages[model] = {};
    for (const [, key] of summaryRows) {
      const values = results
        .map((row) => row.metrics[model]?.[key])
        .filter((value) => typeof value === "number" && Number.isFinite(value));
      modelAverages[model][key] =
        values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null;
    }
  }

  const format = (value, kind) =>
    value === null ? "—" : kind === "percent" ? formatPercent(value) : formatNumber(value);

  const lines = [
    "# Raw-document model comparison",
    "",
    `- Raw directory: \`${options.raw}\``,
    `- Models: ${options.models.map((model) => `\`${model}\``).join(" vs ")}`,
    `- Documents: ${results.length}`,
    "",
    "There are no human corrections for this repository, so the raw document is",
    "the reference. **Preservation** measures how much of the input structure",
    "survived; it is not an absolute quality score, because a model that adds prose",
    "necessarily moves away from the raw text.",
    "",
    "| Metric | " + options.models.join(" | ") + " |",
    "|--------|" + options.models.map(() => "---:|").join(""),
  ];

  for (const [label, key, kind] of summaryRows) {
    const cells = options.models.map((model) =>
      format(modelAverages[model][key], kind),
    );
    lines.push(`| ${label} | ${cells.join(" | ")} |`);
  }

  lines.push("", "## Per document", "");
  lines.push(
    "| Document | " +
      options.models
        .map((model) => `${model} preservation / invented / chars`)
        .join(" | ") +
      " |",
  );
  lines.push(
    "|----------|" +
      options.models.map(() => "---:|").join(""),
  );
  for (const row of results) {
    const cells = options.models.map((model) => {
      const metrics = row.metrics[model];
      if (!metrics || metrics.error) return "FAILED";
      return `${formatPercent(metrics.composite)} / ${formatNumber(metrics.inventedFiles)} / ${formatNumber(metrics.candidateChars)}`;
    });
    lines.push(`| \`${row.id}\` | ${cells.join(" | ")} |`);
  }

  lines.push(
    "",
    "Generated outputs are saved under the output directory, one subdirectory per",
    `model. This report is not a replacement for \`evaluate.mjs\`: without human`,
    "corrections the target prose is unknown.",
    "",
  );

  const reportPath = path.join(options.out, "report.md");
  await fsp.mkdir(options.out, { recursive: true });
  await fsp.writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");

  console.log("");
  console.log(lines.slice(11, 11 + 3 + summaryRows.length).join("\n"));
  console.log("");
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);
  console.log(`Outputs: ${path.relative(process.cwd(), options.out)}`);

  const failures = results.reduce(
    (count, row) =>
      count +
      options.models.filter((model) => row.metrics[model]?.error).length,
    0,
  );
  if (failures > 0) {
    console.error(`\n${failures} request(s) failed.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\ncompare failed: ${error.message}`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exitCode = 1;
});
