#!/usr/bin/env node
/**
 * Build the ExplainHub documentation-enhancer dataset.
 *
 * Each row is ChatML with exactly one user turn and one assistant turn:
 *
 *   user      = buildMdEnhancer(rawMarkdown, language)
 *               (the production prompt, imported from the app, including the
 *                raw Markdown at the end)
 *   assistant = human-corrected Markdown
 *
 * The raw documents are snapshotted under datasets/pairs/<repo>/raw/ so the
 * prompt that a human corrected never changes when the source repository
 * does. Corrections live beside them under datasets/pairs/<repo>/corrected/.
 *
 * Usage:
 *   node training/scripts/build-dataset.mjs --refresh-raw
 *   node training/scripts/build-dataset.mjs
 *   node training/scripts/build-dataset.mjs --strict --require-corrections
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { StructureExtractor } from "../../src/modules/structure-extractor/index.js";
import { CodeParser } from "../../src/modules/code-parser/index.js";
import { TextGenerator } from "../../src/modules/text-generator/index.js";
import { buildMdEnhancer } from "../../src/modules/ai-enhancer/prompt/promptMdEnhancer.js";
import { checkCorrection } from "./lib/markdown-contract.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TRAINING_DIR = path.resolve(SCRIPT_DIR, "..");
const PROMPT_SOURCE = path.resolve(
  TRAINING_DIR,
  "../src/modules/ai-enhancer/prompt/promptMdEnhancer.js",
);

function usage() {
  console.log(`ExplainHub training dataset builder

Usage:
  node training/scripts/build-dataset.mjs [options]

Options:
  --manifest <path>      Repo manifest (default: training/datasets/manifest.json)
  --pairs <path>         Snapshot root (default: training/datasets/pairs)
  --out-dir <path>       Output directory (default: training/data)
  --refresh-raw          Regenerate raw/ snapshots from the repos in the manifest
  --force                Overwrite existing raw/ snapshots during --refresh-raw
  --language <code>      Prompt language: en or es (default: en)
  --max-chars <n>        Rows longer than n chars go to data/long.jsonl (0 = no limit)
  --strict               Exit non-zero when a correction breaks the Markdown contract
  --require-corrections  Exit non-zero when a raw document has no correction
  --help                 Show this message`);
}

function parseArgs(argv) {
  const options = {
    manifest: path.join(TRAINING_DIR, "datasets/manifest.json"),
    pairs: path.join(TRAINING_DIR, "datasets/pairs"),
    outDir: path.join(TRAINING_DIR, "data"),
    refreshRaw: false,
    force: false,
    language: "en",
    maxChars: 0,
    strict: false,
    requireCorrections: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    switch (arg) {
      case "--manifest":
        options.manifest = path.resolve(next());
        break;
      case "--pairs":
        options.pairs = path.resolve(next());
        break;
      case "--out-dir":
        options.outDir = path.resolve(next());
        break;
      case "--refresh-raw":
        options.refreshRaw = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--language":
        options.language = next();
        break;
      case "--max-chars":
        options.maxChars = Number(next());
        if (!Number.isFinite(options.maxChars) || options.maxChars < 0) {
          throw new Error("--max-chars must be a non-negative number");
        }
        break;
      case "--strict":
        options.strict = true;
        break;
      case "--require-corrections":
        options.requireCorrections = true;
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

  if (!["en", "es"].includes(options.language)) {
    throw new Error("--language must be en or es");
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, "utf8"));
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(rootDir, prefix = "") {
  const entries = await fsp.readdir(path.join(rootDir, prefix), {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(rootDir, relative)));
    } else if (entry.isFile()) {
      files.push(relative.split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function gitCommit(repoPath) {
  try {
    return execFileSync("git", ["-C", repoPath, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function generateRawDocs(repoPath) {
  const extractor = new StructureExtractor();
  const { tree, technologies, entryPoints } = await extractor.extract(repoPath);
  const parser = new CodeParser();
  const files = await parser.parse(tree, repoPath);
  const generator = new TextGenerator();
  const { readme, modules } = generator.generate({
    technologies,
    entryPoints,
    files,
    tree,
    projectPath: repoPath,
    format: "md",
  });

  const docs = new Map([["README.md", readme]]);
  for (const moduleDoc of modules) {
    docs.set(`docs/${moduleDoc.name}.md`, moduleDoc.content);
  }
  return docs;
}

async function writeDocs(rootDir, docs) {
  for (const [relative, content] of docs) {
    const target = path.join(rootDir, relative);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, content, "utf8");
  }
}

async function snapshotRepo(repo, options, manifestDir) {
  const repoId = repo.id;
  const repoPath = path.resolve(manifestDir, repo.path);
  const rawDir = path.join(options.pairs, repoId, "raw");

  if (!(await fileExists(repoPath))) {
    return {
      id: repoId,
      status: "missing-repo",
      repoPath,
      docs: 0,
    };
  }

  const docs = await generateRawDocs(repoPath);
  const rawExists = await fileExists(rawDir);

  if (rawExists && !options.force) {
    const nextDir = path.join(options.pairs, repoId, "raw.next");
    await fsp.rm(nextDir, { recursive: true, force: true });
    await writeDocs(nextDir, docs);
    return {
      id: repoId,
      status: "raw-exists",
      repoPath,
      commit: gitCommit(repoPath),
      docs: docs.size,
      nextDir,
    };
  }

  await fsp.rm(rawDir, { recursive: true, force: true });
  await writeDocs(rawDir, docs);
  return {
    id: repoId,
    status: rawExists ? "raw-replaced" : "raw-created",
    repoPath,
    commit: gitCommit(repoPath),
    docs: docs.size,
    rawDir,
  };
}

function docKind(relative) {
  return relative.startsWith("docs/") ? "module" : "readme";
}

function rowId(repoId, relative) {
  return `${repoId}/${relative}`;
}

async function buildRows(repo, options) {
  const pairDir = path.join(options.pairs, repo.id);
  const rawDir = path.join(pairDir, "raw");
  const correctedDir = path.join(pairDir, "corrected");

  if (!(await fileExists(rawDir))) {
    return { rows: [], missingRaw: true, docs: 0, missingCorrections: [] };
  }

  const rawFiles = (await listFiles(rawDir)).filter((file) =>
    file.endsWith(".md"),
  );
  const rows = [];
  const missingCorrections = [];

  for (const relative of rawFiles) {
    const correctedPath = path.join(correctedDir, relative);
    if (!(await fileExists(correctedPath))) {
      missingCorrections.push(relative);
      continue;
    }

    const raw = await fsp.readFile(path.join(rawDir, relative), "utf8");
    const corrected = await fsp.readFile(correctedPath, "utf8");
    const kind = docKind(relative);
    const check = checkCorrection(raw, corrected, { kind });

    if (!check.ok) {
      rows.push({
        id: rowId(repo.id, relative),
        repo: repo.id,
        doc: relative,
        split: repo.split,
        status: "invalid",
        check,
      });
      continue;
    }

    const user = buildMdEnhancer(raw, options.language);
    const assistant = corrected.replace(/\r\n/g, "\n").trimEnd();
    const chars = user.length + assistant.length;

    rows.push({
      id: rowId(repo.id, relative),
      repo: repo.id,
      doc: relative,
      split: repo.split,
      status: "ok",
      chars,
      raw,
      corrected: assistant,
      message: { messages: [
        { role: "user", content: user },
        { role: "assistant", content: assistant },
      ] },
      check,
    });
  }

  return { rows, missingRaw: false, docs: rawFiles.length, missingCorrections };
}

function writeJsonl(filePath, rows) {
  const body = rows.map((row) => JSON.stringify(row.message)).join("\n");
  fs.writeFileSync(filePath, body ? `${body}\n` : "", "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = await readJson(options.manifest);
  const manifestDir = path.dirname(options.manifest);
  const repos = Array.isArray(manifest.repos) ? manifest.repos : [];

  if (repos.length === 0) {
    throw new Error(`No repos found in ${options.manifest}`);
  }

  const snapshotResults = [];
  if (options.refreshRaw) {
    console.log("Refreshing raw document snapshots...");
    for (const repo of repos) {
      if (repo.split === "ignore" || !repo.path) continue;
      const result = await snapshotRepo(repo, options, manifestDir);
      snapshotResults.push(result);
      if (result.status === "raw-exists") {
        console.log(
          `  = ${repo.id}: raw snapshot already exists; wrote candidate to ${path.relative(
            process.cwd(),
            result.nextDir,
          )}. Diff it, then re-run with --force to replace.`,
        );
      } else if (result.status === "raw-created" || result.status === "raw-replaced") {
        console.log(`  ✓ ${repo.id}: ${result.docs} documents in raw/`);
      } else {
        console.log(`  ! ${repo.id}: repo path not found (${result.repoPath})`);
      }
    }
  }

  await fsp.mkdir(options.outDir, { recursive: true });

  const trainRows = [];
  const evalRows = [];
  const evalRefs = [];
  const longRows = [];
  const longRefs = [];
  const repoSummaries = [];
  const allErrors = [];
  let missingRaw = 0;
  let missingCorrectionsTotal = 0;
  let invalidTotal = 0;

  for (const repo of repos) {
    if (repo.split === "ignore") continue;
    if (!["train", "eval"].includes(repo.split)) {
      throw new Error(`Repo ${repo.id}: split must be train, eval, or ignore`);
    }

    const built = await buildRows(repo, options);
    if (built.missingRaw) {
      missingRaw += 1;
      repoSummaries.push({
        id: repo.id,
        split: repo.split,
        status: "no-raw-snapshot",
      });
      continue;
    }

    missingCorrectionsTotal += built.missingCorrections.length;

    let valid = 0;
    let invalid = 0;
    let long = 0;

    for (const row of built.rows) {
      if (row.status !== "ok") {
        invalid += 1;
        invalidTotal += 1;
        allErrors.push(
          `\n[${row.id}]\n${row.check.errors.map((error) => `  - ${error}`).join("\n")}`,
        );
        continue;
      }

      if (row.check.warnings.length > 0) {
        console.log(`  ~ ${row.id}`);
        for (const warning of row.check.warnings) console.log(`    ${warning}`);
      }

      const isLong = options.maxChars > 0 && row.chars > options.maxChars;
      if (isLong) {
        long += 1;
        longRows.push(row);
        longRefs.push({
          id: row.id,
          repo: row.repo,
          doc: row.doc,
          split: row.split,
          chars: row.chars,
        });
        continue;
      }

      valid += 1;
      if (row.split === "train") {
        trainRows.push(row);
      } else {
        evalRows.push(row);
        evalRefs.push({
          id: row.id,
          repo: row.repo,
          doc: row.doc,
          chars: row.chars,
          raw: row.raw,
          corrected: row.corrected,
        });
      }
    }

    repoSummaries.push({
      id: repo.id,
      split: repo.split,
      commit: repo.commit ?? gitCommit(path.resolve(manifestDir, repo.path || ".")),
      path: repo.path ?? null,
      docs: built.docs,
      valid,
      invalid,
      long,
      missingCorrections: built.missingCorrections,
    });
  }

  writeJsonl(path.join(options.outDir, "train.jsonl"), trainRows);
  writeJsonl(path.join(options.outDir, "eval.jsonl"), evalRows);
  writeJsonl(path.join(options.outDir, "long.jsonl"), longRows);

  const evalRefBody = evalRefs.map((row) => JSON.stringify(row)).join("\n");
  fs.writeFileSync(
    path.join(options.outDir, "eval-ref.jsonl"),
    evalRefBody ? `${evalRefBody}\n` : "",
    "utf8",
  );

  const promptSource = fs.readFileSync(PROMPT_SOURCE, "utf8");
  const metadata = {
    generatedAt: new Date().toISOString(),
    language: options.language,
    manifest: path.relative(TRAINING_DIR, options.manifest),
    maxChars: options.maxChars,
    promptSha256: createHash("sha256")
      .update(buildMdEnhancer("", options.language))
      .digest("hex"),
    promptSourceSha256: createHash("sha256").update(promptSource).digest("hex"),
    counts: {
      train: trainRows.length,
      eval: evalRows.length,
      long: longRows.length,
      invalid: invalidTotal,
      missingRaw,
      missingCorrections: missingCorrectionsTotal,
    },
    repos: repoSummaries,
    long: longRefs,
  };

  fs.writeFileSync(
    path.join(options.outDir, "dataset.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );

  console.log("");
  console.log("Dataset summary");
  console.log(`  train rows: ${trainRows.length}`);
  console.log(`  eval rows:  ${evalRows.length}`);
  if (options.maxChars > 0) {
    console.log(`  long rows:  ${longRows.length} (> ${options.maxChars} chars, in long.jsonl)`);
  }
  console.log(`  invalid:    ${invalidTotal}`);
  console.log(`  missing corrections: ${missingCorrectionsTotal}`);
  console.log(`  repos without raw snapshots: ${missingRaw}`);
  console.log(`  output: ${path.relative(process.cwd(), options.outDir)}`);

  if (allErrors.length > 0) {
    console.log("\nContract errors:");
    console.log(allErrors.join("\n"));
  }

  if (options.strict && invalidTotal > 0) {
    console.error("\nStrict mode: fix the contract errors above before training.");
    process.exitCode = 1;
  }
  if (options.requireCorrections && missingCorrectionsTotal > 0) {
    console.error("\nMissing corrections. Add the files listed in dataset.json or run without --require-corrections.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\nbuild-dataset failed: ${error.message}`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exitCode = 1;
});
