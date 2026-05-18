# CodeParser Module

## Overview

The `CodeParser` module parses JavaScript/TypeScript files using `@babel/parser` AST and extracts structural information: imports, exports, functions, classes, and HTTP routes.

**Location:** `src/modules/code-parser/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `CodeParser` class |
| `fileTypes.js` | Extension-to-type mapping |
| `parser.js` | Placeholder |
| `patterns.js` | Placeholder |
| `constants/supportedExtensions.js` | Placeholder |
| `errors/parserError.js` | Placeholder |
| `parsers/parserFactory.js` | Routes files to the correct parser by type |
| `parsers/jsParser.js` | JavaScript parser using `@babel/parser` |
| `parsers/tsParser.js` | Placeholder for TypeScript parser |
| `parsers/htmlParser.js` | Placeholder for HTML parser |
| `extractors/importExtractor.js` | Extracts ESM and CJS imports |
| `extractors/exportsExtractor.js` | Extracts default, named, and re-exports |
| `extractors/declarationExportExtractor.js` | Extracts exports from declarations |
| `extractors/cjsExportExtractor.js` | Extracts `module.exports` patterns |
| `extractors/functionExtractor.js` | Extracts function declarations, methods, arrows |
| `extractors/classExtractor.js` | Extracts class declarations with methods |
| `extractors/routesExtractor.js` | Extracts Express-style route definitions |
| `validators/extensionValidator.js` | Placeholder |
| `validators/parserValidator.js` | Placeholder |
| `utils/fileUtils.js` | Tree traversal, file reading, type detection |

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
Detects default exports, named exports, re-exports, and `export *`.

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

| Extension | Type |
|-----------|------|
| `.js`, `.mjs`, `.cjs`, `.jsx` | `javascript` |
| `.ts`, `.tsx` | `typescript` |
| `.css` | `stylesheet` |
| `.json` | `data` |
| `.html` | `markup` |

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
        +-- getFileType(filePath)  →  "javascript"
        +-- parseByType(type, content)
            +-- jsParser: @babel/parser → AST
            +-- extractImports(ast)
            +-- extractExports(ast)
            +-- extractFunctions(ast)
            +-- extractClasses(ast)
            +-- extractRoutes(ast)
        +-- return { filePath, type, imports, exports, functions, classes, routes }
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `@babel/parser` | npm | JavaScript/TypeScript AST parsing |
| `fs` | `node:fs/promises` | File reading |
| `path` | `node:path` | Path manipulation |

---

## Usage Example

```javascript
import CodeParser from "./src/modules/code-parser/index.js";
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
- **Tree-consumer:** Designed to work with the tree output of `StructureExtractor`, but accepts any flat file list.
