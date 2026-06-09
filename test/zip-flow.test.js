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