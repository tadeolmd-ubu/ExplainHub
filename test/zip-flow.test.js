import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createZip } from "./helpers/zip.js";
import { RepositoryCloner } from "../src/modules/cloner/index.js";

async function fixture(t, files) {
  const root = await fs.mkdtemp(path.join(tmpdir(), "zip-flow-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const zipPath = path.join(root, "input.zip");
  await createZip(zipPath, files);
  return { root, zipPath, cloner: new RepositoryCloner({ baseTempDir: path.join(root, "work") }) };
}

test("extractZip extracts a real archive using the production cloner", async t => {
  const { zipPath, cloner } = await fixture(t, { "test.txt": "Hello World" });
  const result = await cloner.extractZip(zipPath);
  assert.equal(await fs.readFile(path.join(result.repoPath, "test.txt"), "utf8"), "Hello World");
});

test("extractZip rejects invalid input and removes its workspace", async t => {
  const { root, zipPath, cloner } = await fixture(t, {});
  await fs.writeFile(zipPath, "not a zip");
  await assert.rejects(cloner.extractZip(zipPath), /No se pudo extraer/);
  assert.deepEqual(await fs.readdir(path.join(root, "work")), []);
});

test("extractZip rejects an archive containing a real traversal entry", async t => {
  const { root, zipPath, cloner } = await fixture(t, { "ok/file.txt": "malicious" });
  const buffer = await fs.readFile(zipPath);
  // Same-length filename replacement in both local and central headers.
  const from = Buffer.from("ok/file.txt");
  const to = Buffer.from("../file.txt");
  for (let offset = buffer.indexOf(from); offset !== -1; offset = buffer.indexOf(from, offset + to.length)) to.copy(buffer, offset);
  await fs.writeFile(zipPath, buffer);
  await assert.rejects(cloner.extractZip(zipPath), /invalid relative path|Ruta no permitida/);
  await assert.rejects(fs.access(path.join(root, "file.txt")));
  assert.deepEqual(await fs.readdir(path.join(root, "work")), []);
});

test("ZIP limits reject actual oversized decompressed content", async t => {
  const { zipPath, cloner } = await fixture(t, { "large.txt": Buffer.alloc(11 * 1024 * 1024, 65) });
  await assert.rejects(cloner.extractZip(zipPath), /maximum file size/);
});

test("path validation rejects absolute and cross-platform traversal paths", () => {
  const cloner = new RepositoryCloner();
  for (const entry of ["../escape.txt", "/absolute.txt", "C:\\file.txt", "..\\escape.txt"]) {
    assert.throws(() => cloner.safeZipEntryName(entry, "/tmp/project"), /Ruta no permitida/);
  }
});

test("ZIP rejects a dishonest uncompressed-size header during streaming", async t => {
  const { zipPath, cloner } = await fixture(t, { "dishonest.txt": Buffer.alloc(1024 * 1024, 65) });
  const buffer = await fs.readFile(zipPath);
  const central = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  assert.ok(central >= 0);
  buffer.writeUInt32LE(1, central + 24);
  await fs.writeFile(zipPath, buffer);
  await assert.rejects(cloner.extractZip(zipPath), /size|bytes/);
});
