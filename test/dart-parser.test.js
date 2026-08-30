import test from "node:test";
import assert from "node:assert/strict";
import { parseDart } from "../src/modules/code-parser/parsers/dartParser.js";

test("parseDart - extracts imports", async () => {
  const code = `
import "package:flutter/material.dart";
import "./local_util.dart";
`;
  const result = await parseDart(code);
  assert.equal(result.imports.length, 2);
  assert.equal(result.imports[0].source, "package:flutter/material.dart");
  assert.equal(result.imports[1].source, "./local_util.dart");
});

test("parseDart - handles empty imports", async () => {
  const code = `void main() {}`;
  const result = await parseDart(code);
  assert.equal(result.imports.length, 0);
});

test("parseDart - extracts class declaration", async () => {
  const code = `
class Animal {
  final String name;
  Animal(this.name);
  void speak() {}
}
`;
  const result = await parseDart(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "Animal");
  assert.equal(result.classes[0].kind, "class");
});

test("parseDart - extracts class extends", async () => {
  const code = `
class Base {}
class Child extends Base {
  void bar() {}
}
`;
  const result = await parseDart(code);
  const child = result.classes.find((c) => c.name === "Child");
  assert.ok(child);
  assert.equal(child.extends, "Base");
});

test("parseDart - extracts abstract class", async () => {
  const code = `abstract class Shape { void area(); }`;
  const result = await parseDart(code);
  assert.equal(result.classes[0].name, "Shape");
  assert.equal(result.classes[0].kind, "class");
});

test("parseDart - extracts mixin", async () => {
  const code = `
mixin Flyable {
  void fly() {}
}
`;
  const result = await parseDart(code);
  assert.equal(result.classes[0].name, "Flyable");
  assert.equal(result.classes[0].kind, "mixin");
});

test("parseDart - extracts enum", async () => {
  const code = `enum Color { red, green, blue }`;
  const result = await parseDart(code);
  assert.equal(result.classes[0].name, "Color");
  assert.equal(result.classes[0].kind, "enum");
});

test("parseDart - extracts extension with on type", async () => {
  const code = `
extension NumberParsing on String {
  int parseInt() => int.parse(this);
}
`;
  const result = await parseDart(code);
  assert.equal(result.classes[0].name, "NumberParsing");
  assert.equal(result.classes[0].kind, "extension");
  assert.equal(result.classes[0].extends, "String");
});

test("parseDart - generic class keeps type parameters", async () => {
  const code = `class Box<T> { T value; }`;
  const result = await parseDart(code);
  assert.equal(result.classes[0].name, "Box<T>");
});

test("parseDart - extracts class methods", async () => {
  const code = `
class Calculator {
  int add(int a, int b) => a + b;
  void reset() {}
}
`;
  const result = await parseDart(code);
  const methods = result.classes[0].methods;
  const names = methods.map((m) => m.name);
  assert.ok(names.includes("add"));
  assert.ok(names.includes("reset"));
  const add = methods.find((m) => m.name === "add");
  assert.equal(add.kind, "method");
  assert.deepEqual(add.params, ["a", "b"]);
  assert.equal(add.returnType, "int");
});

test("parseDart - extracts constructor as method", async () => {
  const code = `
class Person {
  final String name;
  Person(this.name);
}
`;
  const result = await parseDart(code);
  const ctor = result.classes[0].methods.find((m) => m.name === "Person");
  assert.ok(ctor);
  assert.equal(ctor.kind, "constructor");
  assert.deepEqual(ctor.params, ["name"]);
});

test("parseDart - top-level functions", async () => {
  const code = `
void main() { print("hi"); }
int add(int a, int b) => a + b;
String greeting(String name) => "Hi \$name";
`;
  const result = await parseDart(code);
  const names = result.functions.map((f) => f.name);
  assert.ok(names.includes("main"));
  assert.ok(names.includes("add"));
  assert.ok(names.includes("greeting"));
  const add = result.functions.find((f) => f.name === "add");
  assert.deepEqual(add.params, ["a", "b"]);
  assert.equal(add.returnType, "int");
});

test("parseDart - extracts exports for classes, functions, and typedefs", async () => {
  const code = `
class User {}
typedef JsonMap = Map<String, dynamic>;
void setup() {}
`;
  const result = await parseDart(code);
  const names = result.exports.map((e) => e.name);
  assert.ok(names.includes("User"));
  assert.ok(names.includes("JsonMap"));
  assert.ok(names.includes("setup"));
  const typedef = result.exports.find((e) => e.name === "JsonMap");
  assert.equal(typedef.kind, "typedef");
});

test("parseDart - exports mixin, enum, and extension", async () => {
  const code = `
mixin M {}
enum E { a }
extension X on String {}
`;
  const result = await parseDart(code);
  const names = result.exports.map((e) => e.name);
  assert.ok(names.includes("M"));
  assert.ok(names.includes("E"));
  assert.ok(names.includes("X"));
});

test("parseDart - library export appears in exports", async () => {
  const code = `export "src/models.dart";`;
  const result = await parseDart(code);
  const exp = result.exports.find((e) => e.kind === "export");
  assert.ok(exp);
  assert.equal(exp.name, "src/models.dart");
});

test("parseDart - routes is always empty", async () => {
  const code = `
class Api { void call() {} }
`;
  const result = await parseDart(code);
  assert.deepEqual(result.routes, []);
});