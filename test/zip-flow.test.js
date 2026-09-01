import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import AdmZip from "adm-zip";
import { RepositoryCloner } from "../src/modules/cloner/index.js";

test("extractZip should extract a valid zip and return repoPath", async () => {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "zip-test-"));
  const extractDir = await fs.mkdtemp(path.join(tmpdir(), "zip-extract-"));

  const testFile = path.join(tempDir, "test.txt");
  await fs.writeFile(testFile, "Hello World", "utf-8");

  const zip = new AdmZip();
  zip.addLocalFile(testFile);
  const zipPath = path.join(tempDir, "test.zip");
  zip.writeZip(zipPath);

  const extractor = new AdmZip(zipPath);
  extractor.extractAllTo(extractDir, true);

  const extractedFile = path.join(extractDir, "test.txt");
  const content = await fs.readFile(extractedFile, "utf-8");
  assert.equal(content, "Hello World");

  await fs.rm(tempDir, { recursive: true, force: true });
  await fs.rm(extractDir, { recursive: true, force: true });
});

test("extractZip should throw error for invalid zip path", async () => {
  const cloner = new RepositoryCloner();
  await assert.rejects(
    () => cloner.extractZip("/nonexistent/path.zip"),
    /No se pudo extraer el zip/
  );
});

test("extractZip should not extract entries outside the destination (zip-slip)", async () => {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "zip-slip-"));
  const baseTemp = await fs.mkdtemp(path.join(tmpdir(), "zip-slip-base-"));

  const zip = new AdmZip();
  zip.addFile("normal.txt", Buffer.from("ok"));
  const zipPath = path.join(tempDir, "evil.zip");
  zip.writeZip(zipPath);

  const cloner = new RepositoryCloner({ baseTempDir: baseTemp });
  const result = await cloner.extractZip(zipPath);

  const content = await fs.readFile(
    path.join(result.repoPath, "normal.txt"),
    "utf-8",
  );
  assert.equal(content, "ok");
  assert.equal(
    path.resolve(result.repoPath).startsWith(path.resolve(baseTemp)),
    true,
  );

  await fs.rm(tempDir, { recursive: true, force: true });
  await fs.rm(baseTemp, { recursive: true, force: true });
});

test("extractZip should reject entries that escape the destination directory", async () => {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "zip-escape-"));
  const baseTemp = await fs.mkdtemp(path.join(tmpdir(), "zip-escape-base-"));

  const cloner = new RepositoryCloner({ baseTempDir: baseTemp });
  const repoPath = "/tmp/fake-repo-path";

  for (const name of ["../escape.txt", "/absolute/file.txt", "C:\\file.txt"]) {
    assert.throws(
      () => cloner.safeZipEntryName(name, repoPath),
      /Ruta no permitida dentro del zip/,
      `deberia rechazar: ${name}`,
    );
  }

  assert.equal(cloner.safeZipEntryName("a/b/c.txt", repoPath), "a/b/c.txt");

  await fs.rm(tempDir, { recursive: true, force: true });
  await fs.rm(baseTemp, { recursive: true, force: true });
});

test("extractZip should reject oversized uncompressed content (zip bomb)", async () => {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "zip-bomb-"));

  const zip = new AdmZip();
  zip.addFile("a.txt", Buffer.from("small"));
  const zipPath = path.join(tempDir, "bomb.zip");
  zip.writeZip(zipPath);

  const rewritten = new AdmZip(zipPath);
  const entry = rewritten.getEntries()[0];
  entry.header.size = 101 * 1024 * 1024;
  rewritten.writeZip(zipPath);

  const cloner = new RepositoryCloner();
  await assert.rejects(
    () => cloner.extractZip(zipPath),
    /No se pudo extraer el zip|tamaño máximo permitido/,
  );

  await fs.rm(tempDir, { recursive: true, force: true });
});
