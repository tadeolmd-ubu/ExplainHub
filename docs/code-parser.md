# CodeParser Module

## Overview

The `CodeParser` module parses JavaScript, TypeScript, HTML, CSS, and **SQL** files using `@babel/parser` AST, regex-based parsers, and `node-sql-parser` for SQL, extracting structural information: imports, exports, functions, classes, HTTP routes, and database schema objects.

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

| Extension | Type | Parseable |
|-----------|------|-----------|
| `.js`, `.mjs`, `.cjs`, `.jsx` | `javascript` | Yes |
| `.ts`, `.tsx` | `typescript` | Yes |
| `.html` | `markup` | Yes |
| `.css` | `stylesheet` | Yes |
| `.sql` | `sql` | Yes |
| `.json` | `data` | No |

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
    +-- for each file:
        +-- isParseable()?  skip non-code files
        +-- readFile(filePath)
        +-- getFileType(filePath)  →  "javascript" | "sql"
        +-- parseByType(type, content)
            +-- jsParser: @babel/parser → AST
            +-- tsParser: @babel/parser → AST
            +-- htmlParser: regex-based
            +-- cssParser: regex-based
            +-- sqlParser: node-sql-parser → AST + regex fallback
            +-- extractImports(ast)
            +-- extractExports(ast)
            +-- extractFunctions(ast)
            +-- extractClasses(ast)
            +-- extractRoutes(ast)
        +-- return { filePath, type, imports, exports, functions, classes, routes, tables, views, ... }
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `@babel/parser` | npm | JavaScript/TypeScript AST parsing |
| `node-sql-parser` | npm | SQL AST parsing with dialect support |
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
- **Multi-language:** Supports JS, TS, HTML, CSS, and SQL out of the box.
- **SQL dialect fallback chain:** transactsql → mysql → statement-level mysql → regex — ensures maximum coverage even when `node-sql-parser` cannot parse a given dialect feature.
