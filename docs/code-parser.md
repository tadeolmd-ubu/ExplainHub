# CodeParser Module

## Overview

The `CodeParser` module parses JavaScript, TypeScript, HTML, CSS, **SQL**, **Python**, **PHP**, **C#**, **Rust**, **Java**, **Go**, **C/C++**, **Ruby**, **INI**, **.NET project files** (`.sln`, `.csproj`, `.config`, `.xaml`), and **Cargo project files** (`Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`, `.cargo/config.toml`), extracting structural information: imports, exports, functions, classes, HTTP routes, database schema objects, NuGet packages, UI components, Cargo dependencies, build profiles, workspace structure, and more.

**Location:** `src/modules/code-parser/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `CodeParser` class |
| `fileTypes.js` | Extension-to-type mapping |
| `errors/parserError.js` | Custom `ParserError` class |
| `parsers/parserFactory.js` | Routes files to the correct parser by type |
| `parsers/jsParser.js` | JavaScript parser using `@babel/parser` |
| `parsers/tsParser.js` | TypeScript parser using `@babel/parser` |
| `parsers/htmlParser.js` | HTML parser (regex-based) |
| `parsers/cssParser.js` | CSS parser (regex-based) |
| `extractors/importExtractor.js` | Extracts ESM and CJS imports |
| `extractors/exportsExtractor.js` | Extracts default, named, and re-exports |
| `extractors/declarationExportExtractor.js` | Extracts exports from declarations |
| `extractors/cjsExportExtractor.js` | Extracts `module.exports` patterns |
| `extractors/functionExtractor.js` | Extracts function declarations, methods, arrows |
| `extractors/classExtractor.js` | Extracts class declarations with methods |
| `extractors/routesExtractor.js` | Extracts Express-style route definitions |
| `parsers/sqlParser.js` | SQL parser using `node-sql-parser` + regex fallback |
| `parsers/pyParser.js` | Python parser using shell-to-`ast` (single + batch) |
| `parsers/phpParser.js` | PHP parser using `php-parser` AST (single walk) |
| `parsers/csParser.js` | C# parser using `web-tree-sitter` + WASM grammar |
| `parsers/slnParser.js` | .NET Solution parser (regex-based) |
| `parsers/csprojParser.js` | .NET Project parser (XML via `fast-xml-parser`) |
| `parsers/configParser.js` | .NET Config parser (XML via `fast-xml-parser`) |
| `parsers/xamlParser.js` | WPF/XAML parser (XML via `fast-xml-parser`) |
| `parsers/rsParser.js` | Rust parser using `web-tree-sitter` + WASM grammar |
| `parsers/javaParser.js` | Java parser using `web-tree-sitter` + WASM grammar |
| `parsers/goParser.js` | Go parser using `web-tree-sitter` + WASM grammar |
| `parsers/cParser.js` | C/C++ parser using `web-tree-sitter` + WASM grammar (handles both C and C++) |
| `parsers/rbParser.js` | Ruby parser using `web-tree-sitter` + WASM grammar |
| `parsers/iniParser.js` | INI parser using `web-tree-sitter` + WASM grammar |
| `parsers/cargoTomlParser.js` | Cargo.toml parser using `smol-toml` (package metadata, deps, workspace, features, profiles, build targets, patches) |
| `parsers/cargoLockParser.js` | Cargo.lock parser using `smol-toml` (resolved dependency tree with versions and checksums) |
| `parsers/rustToolChainParser.js` | rust-toolchain.toml parser using `smol-toml` (toolchain channel, components, targets) |
| `parsers/cargoConfigParser.js` | .cargo/config.toml parser using `smol-toml` (build config, registries, aliases, targets) |
| `extractors/alterExtractor.js` | Extracts ALTER TABLE operations |
| `extractors/commentExtractor.js` | Extracts SQL comments |
| `extractors/createOtherExtractor.js` | Extracts CREATE VIEW/INDEX/FUNCTION/PROCEDURE/TRIGGER |
| `extractors/createTableExtractor.js` | Extracts CREATE TABLE columns and constraints |
| `extractors/dmlExtractor.js` | Extracts INSERT/UPDATE/DELETE/SELECT |
| `extractors/dropExtractor.js` | Extracts DROP statements |

---

## Class: `CodeParser`

### `parse(tree, projectPath)`

Main entry point. Flattens the directory tree into a file list and parses each parseable file.

**Parameters:**
- `tree` (object) - Directory tree from `StructureExtractor`
- `projectPath` (string) - Absolute path to the project

**Returns:**
```javascript
[
  {
    filePath: "src/server.js",
    type: "javascript",
    imports: [{ type, source, specifiers, line }],
    exports: [{ name, kind, source, original, line }],
    classes: [{ name, extends, line, methods }],
    routes: [{ method, path, line }],
    functions: [{ name, kind, params, async, line }]
  }
]
```

Each parser may add extra fields beyond the standard 6 (e.g. `projects`, `packages`, `connectionStrings`, `uiComponents`). They pass through via the `...rest` spread in `#processFile`.

---

## Parsers

### JavaScript Parser (`jsParser.js`)

Uses `@babel/parser` with `sourceType: "unambiguous"` and plugins `dynamicImport`, `jsx`.

### TypeScript Parser (`tsParser.js`)

Uses `@babel/parser` with `sourceType: "module"` and plugins `typescript`, `jsx`.

### HTML Parser (`htmlParser.js`)

Regex-based. Extracts:
- `<title>` as exports
- `<script src>` as imports
- `<link href>` as imports

### CSS Parser (`cssParser.js`)

Regex-based. Extracts:
- CSS classes (`.class-name`) as exports
- `@keyframes` as exports
- `--variables` as functions
- `@import` as imports

### SQL Parser (`sqlParser.js`)

Parses SQL files using `node-sql-parser` (`Parser.astify()`) with dialect detection and regex-based fallback for statements the AST parser cannot handle.

**Dialect detection** (`detectDialect`):
- **transactsql**: bracket identifiers `[name]`, `TOP`, `IDENTITY`, `OUTPUT`, `GO`
- **mysql**: backtick identifiers `` `name` ``, `AUTO_INCREMENT`
- **postgresql**: `SERIAL`, `::` casts, `PLPGSQL`

**Parsing flow:**
1. Detect dialect from content
2. For **transactsql**: split by `GO` → per batch try `astify`(transactsql) → try `astify`(mysql) → split into individual statements → `astify`(mysql) per statement → regex fallback
3. For **mysql/postgresql**: global `astify` → regex fallback

**Extracted objects:**

| Type | Properties | Source |
|------|-----------|--------|
| Tables | `name, columns[], foreignKeys[], primaryKey[]` | AST or regex |
| Views | `name, select` | AST or regex |
| Indexes | `name, table, columns[], type, using` | Regex |
| Functions | `name, params[], returnType` | AST + regex params |
| Procedures | `name, params[]` | AST + regex params |
| Triggers | `name, timing, event, table` | Regex |
| DML | `table, columns, values` (insert), `table, set` (update), `from, where` (delete/select) | AST |
| ALTER | `table, operations[]` | AST or regex |
| DROP | `keyword, name` | Regex |

**Column extraction from CREATE TABLE (fallback):**
When AST parsing fails (e.g. SQL Server types `VARCHAR(MAX)`, `DATETIME2`), a balanced-parenthesis parser extracts the table body and splits column definitions by comma (respecting nested parens). Each column yields `{ name, type, nullable }`.

**Parameter extraction from CREATE FUNCTION/PROCEDURE (fallback):**
- **MySQL/PostgreSQL style**: parenthesized list `(param1 TYPE, param2 TYPE)`
- **SQL Server style**: flat list after name before `AS`/`BEGIN` `@param1 TYPE, @param2 TYPE`
- Each parameter yields `{ mode, name, type }` (mode defaults to `"IN"`)

**Return value** (added to the file result):
```javascript
{
  tables:        [{ name, columns, foreignKeys, primaryKey, uniqueConstraints, check, indexes }],
  views:         [{ name, select }],
  indexes:       [{ name, table, columns, type, using }],
  storedProcedures: [{ name, params }],
  triggers:      [{ name, timing, event, table }],
  databases:     [{ name }],
  inserts:       [{ table, columns, values }],
  updates:       [{ table, set }],
  deletes:       [{ from, where }],
  selects:       [{ columns, from, joins, where, ... }],
  alterTables:   [{ table, operations }],
  drops:         [{ keyword, name }],
  comments:      [{ line, content, type }]
}
```

---

### Python Parser (`pyParser.js`)

Parses Python files by spawning a single `python3` process and using the built-in `ast` module. All `.py` files in a project are **batched** into one invocation for performance (~100 files in ~80ms).

**Extracted objects:**

| Element | Properties | How |
|---------|-----------|-----|
| Imports | `type("import"|"from"), source, alias/specifiers, line` | `ast.walk()` |
| Functions | `name, kind("function"|"async"), params[], line` | Module-level only (`tree.body`), no class methods |
| Classes | `name, extends, methods[], line` | Module-level with `methods[]` extracted from class body |
| Routes | `method, path, line` | Flask/FastAPI decorators (`@app.get`, `@app.route`) + Django `urlpatterns` (`path()`, `re_path()`) |
| Exports | `name, kind("module"), line` | `__all__` + public module-level names (non-`_` prefixed) |

**Fault tolerance:**
- `SyntaxError` in Python code → returns empty arrays (not crash)
- `python3` not installed → returns empty arrays
- Invalid JSON from Python → returns empty arrays

---

### PHP Parser (`phpParser.js`)

Parses PHP files using the `php-parser` npm package (pure JS, zero dependencies). Uses a single recursive walk over the AST to extract all data in one pass.

**Extracted objects:**

| Element | Properties | How |
|---------|-----------|-----|
| Imports | `source, alias, line` | `usegroup` nodes → items |
| Functions | `name, params[], line` | Module-level `function` nodes |
| Classes | `name, kind("class"|"interface"|"trait"|"enum"), extends, methods[], constants[], line` | Class body with method and constant extraction |
| Routes | `method, path, line` | `Route::get/post/...` static calls + PHP 8 attributes (`#[Route()]`, `#[Get()]`, `#[Post()]`, etc.) |
| Exports | `name, kind, line` | Public functions, classes, interfaces, traits, enums, constants, and global variables |

**PHP 8 attribute routes:**
- `#[Route('/path', methods: ['GET'])]` → extracts path and method from named `methods` argument
- `#[Get('/path')]`, `#[Post('/path')]`, etc. → attribute name becomes the HTTP method

**Fault tolerance:**
- Parse errors in PHP code propagate as exceptions (handled by CodeParser's per-file try/catch)

---

### C# Parser (`csParser.js`)

Parses `.cs` files using `web-tree-sitter` with a prebuilt C# WASM grammar (from `@vscode/tree-sitter-wasm`). The parser initializes lazily (singleton pattern) and walks the Concrete Syntax Tree (CST) recursively.

**Initialization:**
```javascript
const parser = await getParser();
// Parser.init() → Language.load(wasmGrammar, { locateFile }) → new Parser().setLanguage(lang)
const tree = parser.parse(content);
// walk(tree.rootNode, null) → recursive CST traversal
```

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Imports | `using_directive` | `source, alias, line` |
| Functions | `local_function_statement` (top-level) | `name, params[], line` |
| Classes | `class_declaration`, `struct_declaration`, `interface_declaration`, `record_declaration` | `name, kind, methods[], line` |
| Class methods | `method_declaration` (inside a class body) | `name, params[], line` (added to parent class's `methods[]`) |
| Routes | `attribute_list` with `HttpGet`, `HttpPost`, `HttpPut`, `HttpDelete`, `Route`, `AcceptVerbs` | `method, path, line` |
| Exports | Top-level `public` types and functions | `name, kind, line` |

**Route attribute handling:**
- `[HttpGet]` → `GET /`
- `[HttpGet("{id}")]` → `GET {id}`
- `[Route("api/[controller]")]` → `ANY api/[controller]`
- `[AcceptVerbs]` → `ANY /`

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

### Solution Parser (`slnParser.js`)

Parses `.sln` files using regex. Each project in the solution is defined by a line:
```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "WebApp", "src\WebApp.csproj", "{GUID}"
```

**Captures:**
- `name` — project name
- `path` — relative path to `.csproj` (backslashes normalized to `/`)
- `type` — human-readable type from GUID map (C#, VB.NET, C++, Solution Folder, Test, etc.)

**Project type GUID map:**
| GUID | Type |
|------|------|
| `FAE04EC0-301F-11D3-BF4B-00C04F79EFBC` | C# |
| `F184B08F-C81C-45F6-A57F-5ABD9991F28F` | VB.NET |
| `8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942` | C++ |
| `E24C65DC-737E-472B-9ABA-BC803B73C61A` | Solution Folder |
| `3AC096D0-A1C2-E12C-1390-A8335801FDAB` | Test |

**Return value:**
```javascript
{
  imports: ["src/WebApp.csproj"],  // paths for compatibility
  projects: [{ name: "WebApp", path: "src/WebApp.csproj", type: "C#" }]
}
```

---

### Project Parser (`csprojParser.js`)

Parses `.csproj` files using `fast-xml-parser`. Supports both modern SDK-style and legacy .NET Framework formats.

**Modern format:**
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
```

**Legacy format (.NET Framework):**
```xml
<Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup>
    <Reference Include="Azure.Core, Version=1.47.1.0, Culture=neutral">
      <HintPath>packages\Azure.Core.1.47.1\lib\net472\Azure.Core.dll</HintPath>
    </Reference>
  </ItemGroup>
</Project>
```

**Extracted objects:**

| Element | Source | Properties |
|---------|--------|-----------|
| NuGet packages | `<PackageReference>` (modern) or `<Reference>` + `<HintPath>` (legacy) | `name, version, hintPath?` |
| Project references | `<ProjectReference>` | `path` |
| Framework | `<TargetFramework>` or `<TargetFrameworkVersion>` | `"net8.0"`, `"v4.8.1"` |
| SDK | `Sdk` attribute (modern) or `ToolsVersion` (legacy) | `"Microsoft.NET.Sdk.Web"`, `"Legacy (v15.0)"` |
| Output type | `<OutputType>` | `"WinExe"`, `"Exe"`, `"Library"` |

**Version extraction:**
- **From HintPath** (preferred): `packages\Azure.Core.1.47.1\lib\...` → extracts `1.47.1`
- **From Include** (fallback): `"Azure.Core, Version=1.47.1.0"` → extracts `1.47.1.0`

---

### Config Parser (`configParser.js`)

Parses `.config` files using `fast-xml-parser`. Auto-detects the XML root element and handles two formats:

**App.config / Web.config:**
```xml
<configuration>
  <connectionStrings>
    <add name="DbTaller" connectionString="Server=..." providerName="..." />
  </connectionStrings>
  <appSettings>
    <add key="Env" value="Development" />
  </appSettings>
</configuration>
```

**packages.config (NuGet legacy):**
```xml
<packages>
  <package id="Azure.Core" version="1.47.1" targetFramework="net481" />
  <package id="MahApps.Metro" version="2.4.11" targetFramework="net481" />
</packages>
```

**Extracted objects:**

| Element | Source | Properties |
|---------|--------|-----------|
| Connection strings | `<connectionStrings><add>` | `name, connectionString, providerName` |
| App settings | `<appSettings><add>` | `key, value` |
| NuGet packages | `<packages><package>` | `name, version, targetFramework` |

---

### XAML Parser (`xamlParser.js`)

Parses `.xaml` files using `fast-xml-parser` with recursive tree walking. Handles WPF, MAUI, UWP, and WinUI XAML.

**Extracted objects:**

| Element | Source | Properties |
|---------|--------|-----------|
| Code-behind class | `x:Class` attribute on root element | `name, kind: "xaml"` |
| UI components | Elements with `x:Name` or `Name` | `type, name, parentType` |
| Event handlers | Attributes: Click, Loaded, TextChanged, SelectionChanged, MouseDown, etc. | `name, kind: "event", params: ["sender", "e"]` |

**Example:**
```xml
<Window x:Class="AppTaller.Views.FrmLogin">
  <Button x:Name="btnLogin" Click="OnLogin" />
</Window>
```
→ `classes: [{ name: "AppTaller.Views.FrmLogin", kind: "xaml" }]`
→ `uiComponents: [{ type: "Button", name: "btnLogin", parentType: "Window" }]`
→ `functions: [{ name: "OnLogin", kind: "event", params: ["sender", "e"] }]`

**Supported event attributes:**
`Click`, `Loaded`, `Initialized`, `TextChanged`, `SelectionChanged`, `Checked`, `Unchecked`, `MouseDown`, `MouseUp`, `KeyDown`, `KeyUp`

---

### Rust Parser (`rsParser.js`)

Parses `.rs` files using `web-tree-sitter` with a prebuilt Rust WASM grammar (from `@vscode/tree-sitter-wasm`). Uses the same lazy singleton pattern as the C# parser.

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Imports | `use_declaration` | `source, alias, line` |
| Functions | `function_item` (module-level, outside `impl`) | `name, params[], line` |
| Structs | `struct_item` | `name, kind: "struct", methods[], line` |
| Enums | `enum_item` | `name, kind: "enum", line` |
| Traits | `trait_item` | `name, kind: "trait", methods[], line` |
| Impl methods | `function_item` inside `impl_item` | Attached to parent struct/enum via `type_identifier` |
| Routes | `attribute_item` with `#[get("...")]`, `#[post("...")]`, etc. | `method, path, line` |
| Exports | Items with `visibility_modifier: "pub"` | `name, kind, line` |

**Route attribute handling:**
- `#[get("/path")]` → `GET /path`
- `#[post("/path")]` → `POST /path`
- `#[put("/path")]` → `PUT /path`
- `#[delete("/path")]` → `DELETE /path`
- `#[route("/path", method = "GET")]` → `ANY /path`

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

### Ruby Parser (`rbParser.js`)

Parses `.rb` files using `web-tree-sitter` with a prebuilt Ruby WASM grammar (from `@vscode/tree-sitter-wasm`). Uses the same lazy singleton pattern as the C#, Rust, Java, Go, and C/C++ parsers.

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Imports | `call` with `require`, `require_relative`, `load` | `source, alias, line` |
| Functions | `method` (module-level, outside class/module) | `name, params[], line` |
| Classes | `class` | `name, kind: "class", extends, methods[], line` |
| Modules | `module` (with methods) | `name, kind: "module", methods[], line` |
| Methods | `method` inside `class` or `module` | Attached to parent class/module |
| Routes | `call` with `get`, `post`, `put`, `delete`, `patch`, `head`, `options` | `method, path, line` — Sinatra/Rack style |

**Route detection:**
- `get "/path"` → `GET /path`
- `post "/path"` → `POST /path`
- `put "/path"` → `PUT /path`
- `delete "/path"` → `DELETE /path`

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

### INI Parser (`iniParser.js`)

Parses `.ini` and `.cfg` files using `web-tree-sitter` with a prebuilt INI WASM grammar (from `@vscode/tree-sitter-wasm`). Uses the same lazy singleton pattern as the other tree-sitter parsers.

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Sections | `section` | `name, keys[]` |
| Key-value pairs | `pair` or `assignment` (inside section) | `key, value` |

**Return value:**
```javascript
{
  imports: [],
  functions: [],
  classes: [],
  routes: [],
  exports: [],
  sections: [
    { name: "database", keys: [{ key: "host", value: "localhost" }, ...] },
    { name: "server", keys: [{ key: "port", value: "3000" }, ...] }
  ]
}
```

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

### Cargo.toml Parser (`cargoTomlParser.js`)

Parses `Cargo.toml` files using `smol-toml` (TOML v1.1.0 compliant, zero dependencies, ESM native). Extracts package metadata, dependencies, workspace configuration, feature flags, build profiles, build targets, patches, and platform-specific dependencies.

**Extracted objects:**

| Element | TOML Section | Properties |
|---------|-------------|-----------|
| Package metadata | `[package]` | `name, version, edition, authors, description, license, repository, homepage, documentation, readme, keywords, categories, rustVersion, publish, build, links, resolver, exclude, include, defaultRun` |
| Normal dependencies | `[dependencies]` | `name, version, features[], optional, defaultFeatures, git, branch, tag, rev, path, registry, package, workspace` |
| Dev dependencies | `[dev-dependencies]` | Same as normal |
| Build dependencies | `[build-dependencies]` | Same as normal |
| Features | `[features]` | `{ featureName: string[] }` — supports `dep:`, `?`, and `/` syntax |
| Profiles | `[profile.*]` | `{ name: { optLevel, debug, lto, codegenUnits, panic, incremental, strip, debugAssertions, overflowChecks, inherits } }` |
| Workspace | `[workspace]` | `{ members[], exclude[], defaultMembers[], resolver }` |
| Build targets | `[[bin]]`, `[lib]`, `[[example]]`, `[[test]]`, `[[bench]]` | `{ bin: [{ name, path, requiredFeatures }], lib: { name, path, crateType[], procMacro, doctest }, ... }` |
| Patches | `[patch.*]` | `{ "crates-io": [{ name, version, git, branch, path }] }` |
| Platform deps | `[target.*.dependencies]` | `{ "cfg(unix)": [{ name, version }] }` |

**Dependency formats handled:**

```toml
# Simple string
serde = "1.0"

# Table with options
serde = { version = "1.0", features = ["derive"], optional = true }

# Git dependency
my-fork = { git = "https://github.com/user/fork.git", branch = "feature" }

# Path dependency
local-utils = { path = "libs/local-utils" }

# Workspace inheritance
serde.workspace = true
```

**Return value:**
```javascript
{
  imports: ["serde@1.0", "tokio@1.37", ...],  // for dependencyFormatter
  package: { name, version, edition, authors, ... },
  dependencies: { normal: [...], dev: [...], build: [...] },
  features: { default: ["std"], full: ["std", "derive"] },
  profiles: { release: { optLevel: 3, lto: true }, dev: { debug: true } },
  workspace: { members: ["crate-a", "crate-b"], resolver: "2" },
  buildTargets: { bin: [...], lib: {...}, example: [...], test: [...], bench: [...] },
  patches: { "crates-io": [...] },
  platformDeps: { "cfg(unix)": [...] }
}
```

**Fault tolerance:**
- Invalid TOML → returns empty shape (not crash)
- Missing sections → null/empty defaults

---

### Cargo.lock Parser (`cargoLockParser.js`)

Parses `Cargo.lock` files using `smol-toml`. Extracts the resolved dependency tree with exact versions, sources, and checksums.

**Extracted objects:**

| Element | Properties |
|---------|-----------|
| Packages | `name, version, source, checksum, dependencies[{ name, version }]` |
| Root package | `name, version` — the package without a `source` field |
| Lock version | `lockfileVersion` (1, 2, or 3) |

**Return value:**
```javascript
{
  imports: ["serde@1.0.210", "mi-proyecto@0.1.0", ...],
  lockfileVersion: 3,
  packages: [{ name, version, source, checksum, deps: [...] }],
  rootPackage: { name: "mi-proyecto", version: "0.1.0" }
}
```

---

### Rust Toolchain Parser (`rustToolChainParser.js`)

Parses `rust-toolchain.toml` files using `smol-toml`. Extracts the toolchain configuration for rustup.

**Extracted objects:**

| Element | TOML Section | Properties |
|---------|-------------|-----------|
| Toolchain | `[toolchain]` | `channel, components[], targets[], profile` |

**Example:**
```toml
[toolchain]
channel = "nightly-2024-10-01"
components = ["rustfmt", "clippy"]
targets = ["x86_64-unknown-linux-gnu"]
profile = "default"
```

**Return value:**
```javascript
{
  toolchain: {
    channel: "nightly-2024-10-01",
    components: ["rustfmt", "clippy"],
    targets: ["x86_64-unknown-linux-gnu"],
    profile: "default"
  }
}
```

---

### Cargo Config Parser (`cargoConfigParser.js`)

Parses `.cargo/config.toml` files using `smol-toml`. Extracts Cargo build configuration, custom registries, network settings, command aliases, and per-target build options.

**Extracted objects:**

| Element | TOML Section | Properties |
|---------|-------------|-----------|
| Build config | `[build]` | `target, jobs, rustflags[], linker` |
| Registries | `[registries.*]` | `[{ name, index }]` |
| Network | `[net]` | `git-fetch-with-cli, retry` |
| Aliases | `[alias]` | `{ alias: command }` |
| Targets | `[target.*]` | `{ triple: { linker, rustflags[] } }` |

**Return value:**
```javascript
{
  cargoConfig: {
    build: { target: "x86_64-unknown-linux-gnu", jobs: 4, rustflags: [...], linker: null },
    registries: [{ name: "my-registry", index: "https://..." }],
    net: { git-fetch-with-cli: true, retry: 3 },
    aliases: { b: "build", t: "test" },
    targets: { "x86_64-unknown-linux-gnu": { linker: "clang", rustflags: [...] } }
  }
}
```

---

Parses `.java` files using `web-tree-sitter` with a prebuilt Java WASM grammar (from `@vscode/tree-sitter-wasm`). Uses the same lazy singleton pattern as the C# and Rust parsers.

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Imports | `import_declaration` | `source, alias, line` |
| Classes | `class_declaration`, `interface_declaration`, `enum_declaration`, `record_declaration` | `name, kind, methods[], line` |
| Class methods | `method_declaration` (inside a class body) | `name, params[], line` (added to parent class's `methods[]`) |
| Routes | `annotation` / `marker_annotation` inside `modifiers` — `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`, `@RequestMapping` | `method, path, line` |
| Exports | Top-level `public` types | `name, kind, line` |

**Annotations and visibility:**
- Annotations are inside a `modifiers` node (not direct children of declarations)
- `public` keyword is node type `"public"` (not `"modifier"`)
- Annotation arguments use `annotation_argument_list` (not `argument_list`)

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

### Go Parser (`goParser.js`)

Parses `.go` files using `web-tree-sitter` with a prebuilt Go WASM grammar (from `@vscode/tree-sitter-wasm`). Uses the same lazy singleton pattern as the C#, Rust, and Java parsers.

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Imports | `import_declaration` → `import_spec` | `source, alias, line` (handles simple and grouped imports) |
| Functions | `function_declaration` (module-level) | `name, params[], line` |
| Structs | `type_declaration` → `type_spec` → `struct_type` | `name, kind: "struct", methods[], line` |
| Interfaces | `type_declaration` → `type_spec` → `interface_type` | `name, kind: "interface", methods[], line` |
| Methods | `method_declaration` with receiver | Name via `childForFieldName("name")`, parent resolved from receiver's `type_identifier`; supports pointer receivers (`*T`) |
| Routes | `call_expression` → `selector_expression` with `field_identifier` = `GET`/`POST`/`PUT`/`DELETE`/`PATCH`/`Handle`/`HandleFunc` | `method, path, line` — Gin and std library style |
| Exports | `function_declaration`, `type_spec`, `const_spec`, `var_spec` | `name, kind, line` — Go visibility rule: uppercase = exported |

**Visibility in Go:**
- A name is exported if its first character is uppercase (`isExported(name)`)
- Exported items include: functions, structs, interfaces, constants, and variables with uppercase names

**Route detection:**
- Gin framework: `r.GET("/path", handler)` → `GET /path`
- Standard library: `http.HandleFunc("/path", handler)` → `ANY /path`
- Detected from `call_expression` nodes inside function bodies

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

### C/C++ Parser (`cParser.js`)

Parses `.c`, `.h`, `.cpp`, `.hpp`, `.cc`, `.cxx` files using `web-tree-sitter` with a prebuilt C++ WASM grammar (from `@vscode/tree-sitter-wasm`). The C++ grammar is used for both C and C++ files. Uses the same lazy singleton pattern as the C#, Rust, Java, and Go parsers.

**Extracted objects:**

| Element | CST Node | Properties |
|---------|----------|-----------|
| Imports | `preproc_include` | `source, line` → `#include "header.h"` or `#include <header.h>` |
| Functions | `function_definition` (module-level) | `name, params[], line` — name inside `function_declarator` → `childForFieldName("declarator")` |
| Function prototypes | `declaration` + `function_declarator` (module-level, no body) | `name, params[], line` |
| Classes / Structs / Unions | `class_specifier`, `struct_specifier`, `union_specifier` | `name, kind, methods[], fields[], line` |
| Enums | `enum_specifier` → `enumerator_list` | `name, kind: "enum", line` |
| Class methods | `function_definition` or `field_declaration` + `function_declarator` (inside class body) | `name, params[], line` — attached to parent class via `parentClass` |
| Data fields | `field_declaration` with `field_identifier` (no `function_declarator`) | `name, type, line` — attached to parent class's `fields[]` |
| Inheritance | `base_class_clause` (after class name) | Stored in `inherits` on the class |
| Macros | `preproc_function_def`, `preproc_def` | `name, line` |
| Typedefs | `type_definition` | `name, type, line` |
| Namespaces | `namespace_definition` | `name, line` — provides context via `parentClass` |
| Templates | `template_declaration` | Walked through transparently — parameters accessible via child walk |

**Template and namespace handling:**
- Templates (`template <typename T>`) are transparently walked — the `template_declaration` node's children contain the actual declaration (function or class)
- Namespaces (`namespace foo { ... }`) provide `parentClass` context, so functions inside namespaces don't appear as module-level functions

**Fault tolerance:**
- Tree-sitter CST is error-tolerant — produces partial trees even on syntax errors
- WASM loading errors handled by the calling code

---

## Extractors

### Import Extractor
Detects both ESM (`import ... from`) and CJS (`require()`) imports.

```javascript
// ESM
{ type: "esm", source: "express", specifiers: [{ kind: "default", imported: "express", local: "express" }] }

// CJS
{ type: "cjs", source: "path" }
```

### Export Extractor
Detects default exports, named exports, re-exports, `export *`, and CJS `module.exports`.

```javascript
{ name: "app", kind: "default", line: 1 }
{ name: "helper", kind: "named", line: 5 }
{ name: "utils", kind: "re-export", source: "./utils.js" }
```

### Function Extractor
Detects function declarations, class methods, arrow functions, and function expressions.

```javascript
{ name: "startServer", kind: "function", params: ["port"], async: false, line: 5 }
{ name: "connectDb", kind: "arrow", params: [], async: true, line: 12 }
```

### Class Extractor
Detects class declarations with inheritance and methods.

```javascript
{ name: "AppError", extends: "Error", line: 5, methods: [{ name: "log", kind: "method" }] }
```

### Routes Extractor
Detects Express-style HTTP route definitions (`get`, `post`, `put`, `delete`, `patch`).

```javascript
{ method: "GET", path: "/health", line: 8 }
```

---

## File Types

| Extension | Type | Parseable | Parser |
|-----------|------|-----------|--------|
| `.js`, `.mjs`, `.cjs`, `.jsx` | `javascript` | Yes | `@babel/parser` |
| `.ts`, `.tsx` | `typescript` | Yes | `@babel/parser` |
| `.html` | `markup` | Yes | regex |
| `.css` | `stylesheet` | Yes | regex |
| `.sql` | `sql` | Yes | `node-sql-parser` + regex |
| `.py`, `.pyw` | `python` | Yes | `python3 -c "import ast"` (batch) |
| `.php` | `php` | Yes | `php-parser` |
| `.cs` | `csharp` | Yes | `web-tree-sitter` (WASM) |
| `.rs` | `rust` | Yes | `web-tree-sitter` (WASM) |
| `.java` | `java` | Yes | `web-tree-sitter` (WASM) |
| `.go` | `go` | Yes | `web-tree-sitter` (WASM) |
| `.c`, `.h` | `c` | Yes | `web-tree-sitter` (WASM) |
| `.cpp`, `.hpp`, `.cc`, `.cxx` | `cpp` | Yes | `web-tree-sitter` (WASM) |
| `.rb`, `.rake`, `.gemspec` | `ruby` | Yes | `web-tree-sitter` (WASM) |
| `.ini`, `.cfg` | `ini` | Yes | `web-tree-sitter` (WASM) |
| `.sln` | `sln` | Yes | regex |
| `.csproj` | `csproj` | Yes | `fast-xml-parser` |
| `.config` | `config` | Yes | `fast-xml-parser` |
| `.xaml` | `xaml` | Yes | `fast-xml-parser` |
| `Cargo.toml` | `cargotoml` | Yes | `smol-toml` |
| `Cargo.lock` | `cargolock` | Yes | `smol-toml` |
| `rust-toolchain.toml` | `rusttoolchain` | Yes | `smol-toml` |
| `.cargo/config.toml` | `cargoconfig` | Yes | `smol-toml` |
| `.json` | `data` | No | — |

---

## Error Handling

The `ParserError` class provides structured error information:

```javascript
class ParserError extends Error {
  constructor(filePath, reason, fileType)
  // name: "ParserError"
  // filePath, reason, fileType properties
}
```

Each file is wrapped in a try/catch — a parse failure in one file does not stop the entire analysis.

---

## Flow

```
CodeParser.parse(tree, projectPath)
    |
    +-- traverse(tree)  →  flatten to file list
    |
    +-- batch step: collect all Python files
    |       readFile() for each → parsePythonBatch() → parsed results
    |
    +-- for each non-Python parseable file:
    |       readFile(filePath)
    |       getFileType(filePath)  →  "javascript" | "sql" | "csharp" | "sln" | ...
    |       parseByType(type, content)
    |           +-- jsParser: @babel/parser → AST
    |           +-- tsParser: @babel/parser → AST
    |           +-- htmlParser: regex-based
    |           +-- cssParser: regex-based
    |           +-- sqlParser: node-sql-parser → AST + regex fallback
    |           +-- phpParser: php-parser → AST (single walk)
    |           +-- csParser: web-tree-sitter → CST (recursive walk)
     |           +-- rsParser: web-tree-sitter → CST (recursive walk)
     |           +-- javaParser: web-tree-sitter → CST (recursive walk)
     |           +-- goParser: web-tree-sitter → CST (recursive walk)
     |           +-- cParser: web-tree-sitter → CST (recursive walk, handles both C and C++)
     |           +-- rbParser: web-tree-sitter → CST (recursive walk)
     |           +-- iniParser: web-tree-sitter → CST (sections + key-value pairs)
     |           +-- slnParser: regex-based
    |           +-- csprojParser: fast-xml-parser → XML
    |           +-- configParser: fast-xml-parser → XML (auto-detect App.config vs packages.config)
    |           +-- xamlParser: fast-xml-parser → XML (recursive walk)
    |           +-- cargoTomlParser: smol-toml → TOML (package, deps, workspace, features, profiles, targets)
    |           +-- cargoLockParser: smol-toml → TOML (resolved dependency tree)
    |           +-- rustToolChainParser: smol-toml → TOML (toolchain config)
    |           +-- cargoConfigParser: smol-toml → TOML (build config, registries, aliases)
    |       return { filePath, type, imports, exports, functions, classes, routes, ... }
    |
    +-- merge Python batch results with individual results
    +-- return all results[]
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `@babel/parser` | npm | JavaScript/TypeScript AST parsing |
| `node-sql-parser` | npm | SQL AST parsing with dialect support |
| `php-parser` | npm | PHP AST parsing (pure JS, zero deps) |
| `python3` (ast) | system | Python AST parsing via `execFile` subprocess |
| `web-tree-sitter` | npm | Tree-sitter WASM runtime for C#, Rust, Java, Go, C/C++, Ruby, and INI parsing |
| `@vscode/tree-sitter-wasm` | npm | Prebuilt C#, Rust, Java, Go, C/C++, Ruby, and INI WASM grammars (VS Code sourced) |
| `fast-xml-parser` | npm | XML parsing for .csproj, .config, .xaml |
| `smol-toml` | npm | TOML parsing for Cargo.toml, Cargo.lock, rust-toolchain.toml, .cargo/config.toml |
| `execFile` | `node:child_process` | Spawn Python process (single batch per project) |
| `fs` | `node:fs/promises` | File reading |
| `path` | `node:path` | Path manipulation |

---

## Usage Example

```javascript
import { CodeParser } from "./src/modules/code-parser/index.js";
import { StructureExtractor } from "./src/modules/structure-extractor/index.js";

const extractor = new StructureExtractor();
const { tree } = await extractor.extract("/path/to/project");

const parser = new CodeParser();
const files = await parser.parse(tree, "/path/to/project");

console.log(files[0].imports);  // imports of first file
console.log(files[0].routes);   // routes of first file
```

---

## Architecture Notes

- **Fail-soft:** Each extractor wraps its logic in try/catch and returns `[]` on error, so one malformed file doesn't break the entire analysis.
- **Extensible parsers:** Add a new language by creating a parser in `parsers/` and registering it in `parserFactory.js`.
- **ParserError:** Provides structured error context (file path, reason, file type) for debugging.
- **Multi-language:** Supports JS, TS, HTML, CSS, SQL, Python, PHP, C#, Rust, Java, Go, C, C++, Ruby, INI, .sln, .csproj, .config, .xaml, Cargo.toml, Cargo.lock, rust-toolchain.toml, and .cargo/config.toml out of the box.
- **SQL dialect fallback chain:** transactsql → mysql → statement-level mysql → regex — ensures maximum coverage even when `node-sql-parser` cannot parse a given dialect feature.
- **Tree-sitter WASM initialization:** Lazy singleton pattern — `Parser.init()` and `Language.load()` run once per language, reused across all `.cs`, `.rs`, `.java`, `.go`, `.c`, `.h`, `.cpp`, `.hpp`, `.cc`, `.cxx`, `.rb`, and `.ini` files.
- **XML auto-detection:** The config parser detects the root element (`<configuration>` vs `<packages>`) to route between App.config and packages.config formats.
- **TOML project files:** Cargo parsers handle `Cargo.toml` (package metadata, dependencies, workspace, features, profiles, build targets, patches), `Cargo.lock` (resolved dependency tree), `rust-toolchain.toml` (toolchain config), and `.cargo/config.toml` (build config, registries, aliases). File type resolution uses filename-based overrides for files sharing the `.toml` extension.
