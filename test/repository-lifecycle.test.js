import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir, homedir } from "node:os";
import { createZip } from "./helpers/zip.js";
import net from "node:net";
import { RepositoryCloner } from "../src/modules/cloner/index.js";
import { StructureExtractor } from "../src/modules/structure-extractor/index.js";
import { validateRepositorySize } from "../src/modules/security/repositorySizeValidator.js";
import { validateRealPath } from "../src/modules/security/pathValidator.js";
import { normalizeSource } from "../src/modules/security/source.js";
import { repositoryLimits } from "../src/modules/security/limits.js";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(tmpdir(), "lifecycle-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test("concurrent extractions never share or delete their sibling workspace", async t => {
  const root = await fixture(t);
  const archive = path.join(root, "project.zip");
  await createZip(archive, { "project/index.js": "export const ok = true;" });
  const cloner = new RepositoryCloner({ baseTempDir: path.join(root, "temp") });
  const [a, b] = await Promise.all([cloner.extractZip(archive), cloner.extractZip(archive)]);
  assert.notEqual(a.tempPath, b.tempPath);
  assert.equal(path.basename(a.repoPath), "project", "unwraps archive root");
  await cloner.cleanup(a.tempPath);
  await fs.access(path.join(b.repoPath, "index.js"));
  await assert.rejects(cloner.cleanup(root), /owned temporary/);
});

test("validator and extractor both skip external and circular symlinks", async t => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, "file.js"), "export const ok = true;");
  await fs.symlink(root, path.join(root, "cycle"));
  await fs.symlink("/etc", path.join(root, "external"));
  assert.equal((await validateRepositorySize(root)).fileCount, 1);
  const { tree } = await new StructureExtractor().extract(root);
  assert.deepEqual(tree.children.map(c => c.name), ["file.js"]);
  await assert.rejects(validateRealPath(path.join(root, "external")), /sensible/);
});

test("limits reject oversized files and excessive depth during traversal", async t => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, "file.js"), "12345");
  const result = await validateRepositorySize(root, { ...repositoryLimits, maxFileBytes: 4 });
  assert.equal(result.safe, false);
  await fs.mkdir(path.join(root, "a", "b"), { recursive: true });
  assert.equal((await validateRepositorySize(root, { ...repositoryLimits, maxDepth: 1 })).safe, false);
});

test("source normalization handles SSH, uppercase ZIP and tilde", () => {
  assert.deepEqual(normalizeSource(" ~/project.ZIP "), { type: "zip", value: path.join(homedir(), "project.ZIP") });
  assert.equal(normalizeSource("ssh://git@example.com/repo").type, "remote");
  assert.throws(() => normalizeSource(42), /non-empty string/);
  assert.throws(() => normalizeSource("ftp://example.com/repo"), /Unsupported/);
});

test("clone timeout terminates a stalled Git connection and cleans its workspace", { timeout: 5000 }, async t => {
  const root = await fixture(t);
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    for (const socket of sockets) socket.destroy();
    return new Promise(resolve => server.close(resolve));
  });
  const baseTempDir = path.join(root, "clones");
  const cloner = new RepositoryCloner({ baseTempDir, cloneTimeoutMs: 100 });
  await assert.rejects(cloner.clone(`git://127.0.0.1:${server.address().port}/stalled`), /timeout/);
  assert.deepEqual(await fs.readdir(baseTempDir), []);
});
