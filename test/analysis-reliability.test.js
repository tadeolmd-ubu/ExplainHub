import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseJavaScript } from "../src/modules/code-parser/parsers/jsParser.js";
import { resolveRoutes } from "../src/modules/code-parser/resolveRoutes.js";
import { AnalyzerService } from "../src/core/analyzer/analyzer.service.js";
import { TextGenerator } from "../src/modules/text-generator/index.js";
import app from "../src/app.js";

const exec = promisify(execFile);

test("Express detection excludes cache and clients and composes imported router mounts", () => {
  const source = `import express from "express"; import api from "./routes.js";
    const app = express(); const cache = new Map(); cache.get("user"); axios.get("/external");
    app.get("/health", handler); app.use("/api", api);`;
  const router = `import {Router} from "express"; const router = Router(); router.post("/analyze", handler); export default router;`;
  const files = [{ filePath: "/project/app.js", ...parseJavaScript(source) }, { filePath: "/project/routes.js", ...parseJavaScript(router) }];
  resolveRoutes(files);
  assert.deepEqual(files.flatMap(f => f.routes.map(r => `${r.method} ${r.path}`)), ["GET /health", "POST /api/analyze"]);
});

test("parser failures are returned while valid files and Spanish offline output survive", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "analysis-reliability-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, "good.js"), "export function useful() {};");
  await fs.writeFile(path.join(root, "broken.js"), "export function (");
  await fs.writeFile(path.join(root, "broken.py"), "def invalid(:");
  await fs.writeFile(path.join(root, "Cargo.toml"), "[broken");
  await fs.writeFile(path.join(root, "ignored.txt"), "not source");
  const result = await new AnalyzerService().analyze(root, "txt", "es", { ai: false });
  assert.equal(result.aiUsed, false);
  assert.equal(result.parserFailures, 3);
  assert.ok(result.summary.includes("useful"));
  assert.ok(result.summary.includes("RESUMEN DEL PROYECTO"));
  assert.deepEqual(result.skippedFiles, ["ignored.txt"]);
  assert.equal(result.diagnostics.length, 3);
});

test("Markdown localizes labels without translating identifiers", () => {
  const { readme, modules } = new TextGenerator().generate({ format: "md", language: "es", projectPath: "/project", technologies: ["node"], entryPoints: {}, files: [{ filePath: "/project/src/a.js", type: "javascript", functions: [{ name: "Functions", kind: "function" }] }] });
  assert.ok(readme.includes("## Resumen"));
  assert.ok(modules[0].content.includes("## Funciones"));
  assert.ok(modules[0].content.includes("| Functions |"));
});

test("CLI exposes flags and exits nonzero on invalid arguments", async () => {
  const cli = "src/modules/cli/index.js";
  assert.match((await exec(process.execPath, [cli, "--help"])).stdout, /--no-ai/);
  await assert.rejects(exec(process.execPath, [cli, ".", "--format", "invalid"]), error => error.code === 1);
});

test("CLI creates persistent Spanish Markdown without modifying the input", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "cli-output-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project");
  const output = path.join(root, "reports");
  await fs.mkdir(project);
  await fs.writeFile(path.join(project, "README.md"), "Original");
  await fs.writeFile(path.join(project, "index.js"), "export function greet() {}");
  await exec(process.execPath, ["src/modules/cli/index.js", project, "--format", "md", "--language", "es", "--output", output, "--no-ai"]);
  const reports = await fs.readdir(output);
  assert.equal(reports.length, 1);
  assert.match(await fs.readFile(path.join(output, reports[0], "README.md"), "utf8"), /## Resumen/);
  assert.equal(await fs.readFile(path.join(project, "README.md"), "utf8"), "Original");
});

test("API rejects invalid bodies, remote sources and paths outside its root", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "api-validation-"));
  const previous = process.env.ANALYSIS_ROOT;
  const token = process.env.API_TOKEN;
  process.env.ANALYSIS_ROOT = root;
  delete process.env.API_TOKEN;
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(async () => {
    if (previous === undefined) delete process.env.ANALYSIS_ROOT; else process.env.ANALYSIS_ROOT = previous;
    if (token !== undefined) process.env.API_TOKEN = token;
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  });
  const post = body => fetch(`http://127.0.0.1:${server.address().port}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post({ projectPath: 42 })).status, 400);
  assert.equal((await post({ projectPath: "https://example.com/repo" })).status, 400);
  assert.equal((await post({ projectPath: ".." })).status, 403);
  const response = await post({ projectPath: ".", ai: false });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).aiUsed, false);
  let started = 0;
  let notify;
  const bothStarted = new Promise(resolve => { notify = resolve; });
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  t.mock.method(AnalyzerService.prototype, "analyze", async () => {
    if (++started === 2) notify();
    await blocked;
    return { summary: "done" };
  });
  const pending = [post({ projectPath: "." }), post({ projectPath: "." })];
  await bothStarted;
  try { assert.equal((await post({ projectPath: "." })).status, 429); }
  finally { release(); await Promise.all(pending); }
  process.env.API_TOKEN = "test-token";
  assert.equal((await post({ projectPath: "." })).status, 401);
});
