import test from "node:test";
import assert from "node:assert/strict";
import { validatePath } from "../src/modules/security/pathValidator.js";
import { validateRepositorySize } from "../src/modules/security/repositorySizeValidator.js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

//==========PATH VALIDATOR==========//
test("validatePath - safe path returns safe:true", () => {
  const result = validatePath("/tmp/my-project");
  assert.equal(result.safe, true);
  assert.equal(result.resolved, "/tmp/my-project");
  assert.equal(result.reason, undefined);
});

test("validatePath - sensitive path returns safe:false", () => {
  const result = validatePath("/etc/passwd");
  assert.equal(result.safe, false);
  assert.ok(result.reason.includes("sensible"));
});

test("validatePath - home directory subpath is safe", () => {
  const result = validatePath("~/projects/my-app");
  assert.equal(result.safe, true);
});

test("validatePath - resolves relative paths", () => {
  const result = validatePath("./src");
  assert.equal(result.safe, true);
  assert.ok(path.isAbsolute(result.resolved));
});

//==========REPOSITORY SIZE VALIDATOR==========//
test("validateRepositorySize - small project is safe", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-repo-"));
  await fs.writeFile(path.join(tmpDir, "file.js"), "console.log('hello')");
  
  const result = await validateRepositorySize(tmpDir);
  assert.equal(result.safe, true);
  assert.ok(result.fileCount >= 1);
  assert.ok(result.totalSize >= 0);
  
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test("validateRepositorySize - non-existent path throws", async () => {
  await assert.rejects(
    () => validateRepositorySize("/tmp/nonexistent-path-12345"),
    { code: "ENOENT" }
  );
});

test("validateRepositorySize - skips symlinks", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-symlink-"));
  const realFile = path.join(tmpDir, "real.txt");
  const linkFile = path.join(tmpDir, "link.txt");
  
  await fs.writeFile(realFile, "hello");
  await fs.symlink(realFile, linkFile);
  
  const result = await validateRepositorySize(tmpDir);
  assert.equal(result.safe, true);
  assert.equal(result.fileCount, 1);
  
  await fs.rm(tmpDir, { recursive: true, force: true });
});
