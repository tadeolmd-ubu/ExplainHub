import test from "node:test";
import assert from "node:assert/strict";
import { parseSh } from "../src/modules/code-parser/parsers/shParser.js";

test("parseSh - extracts source and dot imports", async () => {
  const code = `
source ./lib.sh
. ./helpers.sh
`;
  const result = await parseSh(code);
  assert.equal(result.imports.length, 2);
  assert.equal(result.imports[0].source, "./lib.sh");
  assert.equal(result.imports[1].source, "./helpers.sh");
});

test("parseSh - ignores shebang comment", async () => {
  const code = `#!/bin/bash\necho hello`;
  const result = await parseSh(code);
  assert.equal(result.imports.length, 0);
  assert.equal(result.functions.length, 0);
});

test("parseSh - extracts function_definition in both syntaxes", async () => {
  const code = `
function greet() {
  echo "hi"
}

build() {
  echo "building"
}
`;
  const result = await parseSh(code);
  assert.equal(result.functions.length, 2);
  assert.equal(result.functions[0].name, "greet");
  assert.equal(result.functions[1].name, "build");
  assert.equal(result.functions[0].kind, "function");
  assert.deepEqual(result.functions[0].params, []);
});

test("parseSh - exports functions and aliases", async () => {
  const code = `
deploy() { echo "ok"; }
alias ll="ls -al"
`;
  const result = await parseSh(code);
  const names = result.exports.map((e) => e.name);
  assert.ok(names.includes("deploy"));
  assert.ok(names.includes("ll"));
});

test("parseSh - exports top-level variables", async () => {
  const code = `
API_URL="https://api.example.com"
for f in *.sh; do
  inner=1
done
`;
  const result = await parseSh(code);
  const names = result.exports.map((e) => e.name);
  assert.ok(names.includes("API_URL"));
  assert.ok(!names.includes("inner"));
});

test("parseSh - exports from export statement", async () => {
  const code = `
export NODE_ENV=production
`;
  const result = await parseSh(code);
  const envExport = result.exports.find((e) => e.name === "NODE_ENV");
  assert.ok(envExport);
  assert.equal(envExport.kind, "export");
});

test("parseSh - extracts curl route with -X method", async () => {
  const code = `
curl -X POST http://api.example.com/users
`;
  const result = await parseSh(code);
  assert.equal(result.routes.length, 1);
  assert.equal(result.routes[0].method, "POST");
  assert.equal(result.routes[0].path, "http://api.example.com/users");
});

test("parseSh - curl default method is GET", async () => {
  const code = `
curl https://api.example.com/health
`;
  const result = await parseSh(code);
  assert.equal(result.routes.length, 1);
  assert.equal(result.routes[0].method, "GET");
  assert.equal(result.routes[0].path, "https://api.example.com/health");
});

test("parseSh - classes is always empty", async () => {
  const code = `
function foo() { :; }
`;
  const result = await parseSh(code);
  assert.deepEqual(result.classes, []);
});