import test from "node:test";
import assert from "node:assert/strict";
import { parseKotlin } from "../src/modules/code-parser/parsers/ktParser.js";

//==========IMPORTS==========//
test("parseKotlin - extracts imports", () => {
  const code = `
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
`;
  const result = parseKotlin(code);
  assert.equal(result.imports.length, 2);
  assert.equal(result.imports[0].source, "android.os.Bundle");
  assert.equal(result.imports[1].source, "androidx.appcompat.app.AppCompatActivity");
});

test("parseKotlin - handles empty imports", () => {
  const code = `fun main() {}`;
  const result = parseKotlin(code);
  assert.equal(result.imports.length, 0);
});

//==========CLASSES==========//
test("parseKotlin - extracts class declaration", () => {
  const code = `
class User(val name: String, val age: Int)
`;
  const result = parseKotlin(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "User");
  assert.equal(result.classes[0].kind, "class");
});

test("parseKotlin - extracts data class", () => {
  const code = `
data class User(val id: String, val name: String)
`;
  const result = parseKotlin(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "User");
  assert.equal(result.classes[0].kind, "data class");
});

test("parseKotlin - extracts interface", () => {
  const code = `
interface UserRepository {
    fun getUser(id: String): User
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "UserRepository");
  assert.equal(result.classes[0].kind, "class");
});

test("parseKotlin - extracts object declaration", () => {
  const code = `
object AppConfig {
    const val VERSION = "1.0"
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "AppConfig");
  assert.equal(result.classes[0].kind, "object");
});

test("parseKotlin - extracts enum class", () => {
  const code = `
enum class Color {
    RED, GREEN, BLUE
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "Color");
  assert.equal(result.classes[0].kind, "enum class");
});

test("parseKotlin - extracts sealed class", () => {
  const code = `
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes.length, 1);
  assert.equal(result.classes[0].name, "Result");
  assert.equal(result.classes[0].kind, "sealed class");
});

//==========INHERITANCE==========//
test("parseKotlin - extracts superclass", () => {
  const code = `
class MainActivity : AppCompatActivity() {
    fun onCreate() {}
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes[0].extends, "AppCompatActivity");
});

test("parseKotlin - extracts interface implementation", () => {
  const code = `
class UserRepo : UserRepository {
    fun getUser(id: String): User = TODO()
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes[0].extends, "UserRepository");
});

//==========FUNCTIONS==========//
test("parseKotlin - extracts top-level functions", () => {
  const code = `
fun main() {
    println("Hello")
}

fun calculateSum(a: Int, b: Int): Int = a + b
`;
  const result = parseKotlin(code);
  assert.equal(result.functions.length, 2);
  assert.equal(result.functions[0].name, "main");
  assert.equal(result.functions[1].name, "calculateSum");
  assert.deepEqual(result.functions[1].params, ["a", "b"]);
});

test("parseKotlin - extracts suspend functions", () => {
  const code = `
suspend fun fetchData(): String = "data"
`;
  const result = parseKotlin(code);
  assert.equal(result.functions.length, 1);
  assert.equal(result.functions[0].name, "fetchData");
  assert.equal(result.functions[0].async, true);
});

test("parseKotlin - does not duplicate class methods in functions", () => {
  const code = `
class User {
    fun getName(): String = "name"
    fun getAge(): Int = 0
}
`;
  const result = parseKotlin(code);
  assert.equal(result.functions.length, 0);
  assert.equal(result.classes[0].methods.length, 2);
});

//==========METHODS==========//
test("parseKotlin - extracts class methods", () => {
  const code = `
class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    suspend fun fetch(): String = "data"
}
`;
  const result = parseKotlin(code);
  assert.equal(result.classes[0].methods.length, 2);
  assert.equal(result.classes[0].methods[0].name, "add");
  assert.equal(result.classes[0].methods[0].async, false);
  assert.equal(result.classes[0].methods[1].name, "fetch");
  assert.equal(result.classes[0].methods[1].async, true);
});

//==========EXPORTS==========//
test("parseKotlin - extracts exports", () => {
  const code = `
class User(val name: String)
fun main() {}
object Config
`;
  const result = parseKotlin(code);
  const exportNames = result.exports.map((e) => e.name);
  assert.ok(exportNames.includes("User"));
  assert.ok(exportNames.includes("main"));
  assert.ok(exportNames.includes("Config"));
});

test("parseKotlin - extracts const val as export", () => {
  const code = `
object AppConfig {
    const val VERSION = "1.0"
}
`;
  const result = parseKotlin(code);
  const versionExport = result.exports.find((e) => e.name === "VERSION");
  assert.ok(versionExport);
  assert.equal(versionExport.kind, "const");
});

//==========ROUTES==========//
test("parseKotlin - routes is always empty", () => {
  const code = `
class UserController {
    fun getUser() {}
}
`;
  const result = parseKotlin(code);
  assert.deepEqual(result.routes, []);
});
