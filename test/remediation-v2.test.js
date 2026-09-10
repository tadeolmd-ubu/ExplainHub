import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import parser from "@babel/parser";
import { analyzeExpress } from "../src/modules/code-parser/extractors/routesExtractor.js";
import { resolveRoutes } from "../src/modules/code-parser/resolveRoutes.js";
import { readFile } from "../src/modules/code-parser/utils/fileUtils.js";
import { readmeFormatter } from "../src/modules/text-generator/formatters/md/readme.js";
import { RepositoryCloner } from "../src/modules/cloner/index.js";
import { createZip } from "./helpers/zip.js";

test("Express route detection ignores shadowed local receivers", () => {
  const ast = parser.parse(`import express from "express"; const app = express(); function f(app) { app.get("cache-key", () => {}); } app.get("/real", () => {});`, { sourceType: "module" });
  assert.deepEqual(analyzeExpress(ast).routes.map(route => route.path), ["/real"]);
});

test("route resolution caps large mount expansions", () => {
  const files = [{ filePath: "/p/routes.js", routes: [{ receiver: "router", path: "/x" }], routeMounts: [], routeImports: {}, routeExports: {} }];
  for (let i = 0; i < 150; i++) files[0].routeMounts.push({ receiver: `app${i}`, target: "router", prefix: `/api${i}` });
  resolveRoutes(files);
  assert.equal(files[0].routes.length, 100);
});

test("Markdown escapes cells and preserves complete entry point paths", () => {
  const output = readmeFormatter({
    technologies: ["Node.js"],
    entryPoints: { "Node.js": ["api/index.js", "web/index.js"] },
    files: [], tree: { children: [] }, projectPath: "/project",
    metadata: { description: "Alpha | Beta\nsecond" },
  });
  assert.match(output, /Node\.js \| api\/index\.js/);
  assert.match(output, /Node\.js \| web\/index\.js/);
  assert.ok(output.includes("Alpha \\| Beta<br>second"));
});

test("ZIP extraction preserves empty directories", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "v2-zip-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const archive = path.join(root, "empty.zip");
  await createZip(archive, { "empty-dir/": null, "file.txt": "content" });
  const cloner = new RepositoryCloner({ baseTempDir: path.join(root, "work") });
  const result = await cloner.extractZip(archive);
  assert.equal((await fs.stat(path.join(result.repoPath, "empty-dir"))).isDirectory(), true);
  await cloner.cleanup(result.tempPath);
});

test("bounded file reads reject an oversized file", async t => {
  const root = await fs.mkdtemp(path.join(tmpdir(), "v2-read-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, "large.js");
  await fs.writeFile(file, Buffer.alloc(10 * 1024 * 1024 + 1, 65));
  await assert.rejects(readFile(file), /oversized/);
});
