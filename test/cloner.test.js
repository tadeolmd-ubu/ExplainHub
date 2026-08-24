import test from "node:test";
import assert from "node:assert/strict";
import { RepositoryCloner } from "../src/modules/cloner/index.js";

const cloner = new RepositoryCloner();

//==========VALIDATE REPOSITORY URL==========//
test("validateRepositoryUrl - valid HTTPS URL", () => {
  const result = cloner.validateRepositoryUrl("https://github.com/user/repo.git");
  assert.equal(result, "https://github.com/user/repo.git");
});

test("validateRepositoryUrl - valid SSH URL", () => {
  const result = cloner.validateRepositoryUrl("git@github.com:user/repo.git");
  assert.equal(result, "git@github.com:user/repo.git");
});

test("validateRepositoryUrl - valid git:// URL", () => {
  const result = cloner.validateRepositoryUrl("git://github.com/user/repo.git");
  assert.equal(result, "git://github.com/user/repo.git");
});

test("validateRepositoryUrl - valid HTTP URL", () => {
  const result = cloner.validateRepositoryUrl("http://example.com/repo.git");
  assert.equal(result, "http://example.com/repo.git");
});

test("validateRepositoryUrl - empty string throws", () => {
  assert.throws(
    () => cloner.validateRepositoryUrl(""),
    /Debes proporcionar una URL/
  );
});

test("validateRepositoryUrl - whitespace only throws", () => {
  assert.throws(
    () => cloner.validateRepositoryUrl("   "),
    /Debes proporcionar una URL/
  );
});

test("validateRepositoryUrl - invalid format throws", () => {
  assert.throws(
    () => cloner.validateRepositoryUrl("not-a-url"),
    /Formato de repositorio no soportado/
  );
});

test("validateRepositoryUrl - trims whitespace", () => {
  const result = cloner.validateRepositoryUrl("  https://github.com/user/repo.git  ");
  assert.equal(result, "https://github.com/user/repo.git");
});

//==========EXTRACT REPOSITORY NAME==========//
test("extractRepositoryName - extracts from SSH URL", () => {
  const name = cloner.extractRepositoryName("git@github.com:user/another-repo.git");
  assert.equal(name, "another-repo");
});

test("extractRepositoryName - extracts from SSH URL", () => {
  const name = cloner.extractRepositoryName("git@github.com:user/another-repo.git");
  assert.equal(name, "another-repo");
});

test("extractRepositoryName - removes .git suffix", () => {
  const name = cloner.extractRepositoryName("https://github.com/user/project.git");
  assert.ok(!name.endsWith(".git"));
});

test("extractRepositoryName - sanitizes special characters", () => {
  const name = cloner.extractRepositoryName("https://github.com/user/my repo.git");
  assert.ok(!name.includes(" "));
});

//==========IS SUPPORTED REMOTE URL==========//
test("isSupportedRemoteUrl - HTTPS", () => {
  assert.equal(cloner.isSupportedRemoteUrl("https://github.com/user/repo"), true);
});

test("isSupportedRemoteUrl - HTTP", () => {
  assert.equal(cloner.isSupportedRemoteUrl("http://example.com/repo"), true);
});

test("isSupportedRemoteUrl - git://", () => {
  assert.equal(cloner.isSupportedRemoteUrl("git://github.com/user/repo"), true);
});

test("isSupportedRemoteUrl - SSH shortcut", () => {
  assert.equal(cloner.isSupportedRemoteUrl("git@github.com:user/repo"), true);
});

test("isSupportedRemoteUrl - local path", () => {
  assert.equal(cloner.isSupportedRemoteUrl("/home/user/project"), false);
});

test("isSupportedRemoteUrl - ftp", () => {
  assert.equal(cloner.isSupportedRemoteUrl("ftp://example.com/repo"), false);
});

//==========IS LIKELY LOCAL PATH==========//
test("isLikelyLocalPath - dot", () => {
  assert.equal(cloner.isLikelyLocalPath("."), true);
});

test("isLikelyLocalPath - dotdot", () => {
  assert.equal(cloner.isLikelyLocalPath(".."), true);
});

test("isLikelyLocalPath - relative with ./", () => {
  assert.equal(cloner.isLikelyLocalPath("./src"), true);
});

test("isLikelyLocalPath - relative with ../", () => {
  assert.equal(cloner.isLikelyLocalPath("../project"), true);
});

test("isLikelyLocalPath - absolute path", () => {
  assert.equal(cloner.isLikelyLocalPath("/home/user/project"), true);
});

test("isLikelyLocalPath - HTTPS URL contains /", () => {
  assert.equal(cloner.isLikelyLocalPath("https://github.com/user/repo"), true);
});

test("isLikelyLocalPath - SSH URL", () => {
  assert.equal(cloner.isLikelyLocalPath("git@github.com:user/repo"), false);
});
