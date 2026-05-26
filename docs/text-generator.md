# TextGenerator Module

## Overview

The `TextGenerator` module transforms structured analysis data (from `StructureExtractor` + `CodeParser`) into a human-readable plain text document. This text is designed to be consumed by an AI for further enhancement.

**Location:** `src/modules/text-generator/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Orchestrator `TextGenerator` class |
| `formatters/headerFormatter.js` | Project overview section |
| `formatters/statsFormatter.js` | Global statistics section |
| `formatters/fileFormatter.js` | Per-file breakdown section |
| `formatters/apiFormatter.js` | API endpoints table |
| `formatters/dependencyFormatter.js` | Dependency map section |

---

## Class: `TextGenerator`

### `generate({ technologies, entryPoints, files })`

Composes all formatter outputs into a single plain text document.

**Parameters:**
- `technologies` (string[]) - Detected technologies from `StructureExtractor`
- `entryPoints` (object) - Entry points per technology
- `files` (FileResult[]) - Parsed file data from `CodeParser`

**Returns:** `string` - Plain text document with sections separated by blank lines.

---

## Formatters

### headerFormatter
Generates the project overview section:
```
PROJECT OVERVIEW
================
Technologies: Node.js, Express
Entry points:
  Node.js → index.js
  Node.js → server.js
```

### statsFormatter
Generates aggregate statistics:
```
PROJECT STATISTICS
==================
Files analyzed: 15
Total imports: 120
Total exports: 45
Total functions: 67
Total classes: 8
Total routes: 23
```

### fileFormatter
Generates a per-file breakdown block. Called once per file:
```
-- src/server.js (javascript) --
Imports: express, path
Exports: app (default)
Functions: startServer (function), connectDb (arrow async)
Classes: AppError extends Error
Routes: GET /health
```
Empty categories are omitted automatically.

### apiFormatter
Generates a global route table. Returns `null` if no routes exist:
```
API ENDPOINTS
=============
GET   /health                   → src/app.js:8
```

### dependencyFormatter
Generates a dependency map per file:
```
DEPENDENCY MAP
==============

src/server.js
  imports: express, path, ./routes
```

---

## Flow

```
TextGenerator.generate({ technologies, entryPoints, files })
    |
    +-- headerFormatter({ technologies, entryPoints })    → string
    +-- statsFormatter(files)                             → string
    +-- files.map(fileFormatter)                          → string[]
    +-- apiFormatter(files)                               → string | null
    +-- dependencyFormatter(files)                        → string
    |
    +-- filter(Boolean)  → remove null sections
    +-- join("\n\n")     → separate sections with blank lines
    +-- return plain text
```

---

## Dependencies

Zero external dependencies. Pure JavaScript functions operating on plain objects and arrays.

---

## Usage Example

```javascript
import { TextGenerator } from "./src/modules/text-generator/index.js";
import { StructureExtractor } from "./src/modules/structure-extractor/index.js";
import { CodeParser } from "./src/modules/code-parser/index.js";

const extractor = new StructureExtractor();
const { tree, technologies, entryPoints } = await extractor.extract("/path/to/project");

const parser = new CodeParser();
const files = await parser.parse(tree, "/path/to/project");

const generator = new TextGenerator();
const output = generator.generate({ technologies, entryPoints, files });

console.log(output);
```

---

## Architecture Notes

- **Single responsibility per formatter:** Each file exports one pure function. No side effects, no class dependencies.
- **Optional sections:** Formatters return `null` when no data is available; the orchestrator filters them.
- **Plain text format:** Uses `==` and `--` delimiters for sections — easy for both humans and LLMs to parse.
- **No coupling:** Formatters receive plain data and return strings. They don't know about `CodeParser`, `StructureExtractor`, or each other.
