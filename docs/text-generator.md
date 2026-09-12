# TextGenerator Module

## Overview

The `TextGenerator` module transforms structured analysis data (from `StructureExtractor` + `CodeParser`) into a human-readable document. It supports two output formats: plain text for AI consumption, and Markdown for generating project documentation.

**Location:** `src/modules/text-generator/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Orchestrator `TextGenerator` class |
| `formatters/txt/headerFormatter.js` | Project overview section (txt) |
| `formatters/txt/statsFormatter.js` | Global statistics section (txt) |
| `formatters/txt/fileFormatter.js` | Per-file breakdown section (txt) |
| `formatters/txt/apiFormatter.js` | API endpoints table (txt) |
| `formatters/txt/dependencyFormatter.js` | Dependency map section (txt) |
| `formatters/txt/tablesFormatter.js` | SQL tables section (txt) |
| `formatters/txt/viewsFormatter.js` | SQL views section (txt) |
| `formatters/txt/indexesFormatter.js` | SQL indexes section (txt) |
| `formatters/txt/routinesFormatter.js` | SQL functions & procedures section (txt) |
| `formatters/txt/triggersFormatter.js` | SQL triggers section (txt) |
| `formatters/txt/dmlFormatter.js` | SQL DML section (txt) |
| `formatters/txt/dropsFormatter.js` | SQL DROP statements section (txt) |
| `formatters/txt/commentsFormatter.js` | SQL comments section (txt) |
| `formatters/txt/alterFormatter.js` | SQL ALTER TABLE section (txt) |
| `formatters/md/readme.js` | README.md markdown generator |
| `formatters/md/modules.js` | Module-level markdown generator |

---

## Class: `TextGenerator`

### `generate({ technologies, entryPoints, files, tree, projectPath, format })`

Composes all formatter outputs into a document.

**Parameters:**
- `technologies` (string[]) - Detected technologies from `StructureExtractor`
- `entryPoints` (object) - Entry points per technology
- `files` (FileResult[]) - Parsed file data from `CodeParser`
- `tree` (object) - Directory tree from `StructureExtractor` (required for `md` format)
- `projectPath` (string) - Project root path (required for `md` format)
- `format` (string) - `"txt"` (default) or `"md"` — selects output path

**Returns:**
- For `"txt"`: `string` - Plain text document with sections separated by blank lines
- For `"md"`:
```javascript
{
  readme: string,                    // README.md content
  modules: [{ name: string, content: string }]  // docs/<module>.md content per directory
}
```

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

### SQL Formatters

Nine formatters handle database schema objects extracted by the SQL parser. Each returns `null` if no data is present.

| Formatter | Section header | Content |
|-----------|---------------|---------|
| `tablesFormatter` | `TABLES` | Table name, columns (type, nullable), foreign keys |
| `viewsFormatter` | `VIEWS` | View name |
| `indexesFormatter` | `INDEXES` | Index name, table |
| `routinesFormatter` | `ROUTINES` | Function/procedure name, params (mode name type), return type |
| `triggersFormatter` | `TRIGGERS` | Trigger name, timing, event, table |
| `dmlFormatter` | `DML` | INSERT/UPDATE/DELETE/SELECT per table |
| `dropsFormatter` | `DROPS` | Drop target type and name |
| `commentsFormatter` | `COMMENTS` | Comment content, line number, type |
| `alterFormatter` | `ALTER TABLES` | Table, operation type, constraint name |

Example output:
```
TABLES
======
db/schema.sql
  usuarios (5 cols)
    - id SERIAL (nullable: false)
    - email VARCHAR(200) (nullable: false)
  Foreign keys: posts.idUsuario → usuarios.id
```

### Markdown Formatters (`formatters/md/`)

Two formatters produce the markdown output for the `"md"` format:

**`readme.js`** — Generates `README.md` with sections:
- `# ` Project name (from `package.json`, Cargo.toml, or git clone directory name)
- `## Overview` — Technologies and entry points
- `## Project Info` — Version, edition, description, license, authors (from Cargo.toml or package.json)
- `## Dependencies` — Dependency table with name, version, and type (from Cargo.toml or package.json)
- `## Features` — Workspace features (from Cargo.toml, only if defined)
- `## Project Structure` — ASCII directory tree (from `tree`)
- `## Modules` — Table with links to `docs/<module>.md` (unique links for duplicate directory names)
- `## API Endpoints` — Route table (if routes exist)
- `## Database Schema` — SQL objects table (if any exist)

All sections are conditional — they only appear if data is available.

**`modules.js`** — Called once per directory with parseable files. Generates `docs/<module>.md` with:
- `# Module: ` name and file path
- `## File Structure` — Table of files with descriptions
- `## Functions` — Table (name, kind, async, file)
- `## Classes` — Table (name, extends, file)
- `## Exports` — Table (name, kind, file)
- `## Routes` — Table (method, path, file)
- `## SQL Objects` — Tables, views, and indexes

---

## Flow

```
TextGenerator.generate({ technologies, entryPoints, files, tree, projectPath, format })
    |
    +-- format === "md" ?
         |
     ┌───┴───┐
     ▼       ▼
    Yes      No
     |       |
     |       ▼
     |   headerFormatter({ technologies, entryPoints })    → string
     |   statsFormatter(files)                             → string
     |   files.map(fileFormatter)                          → string[]
     |   apiFormatter(files)                               → string | null
     |   dependencyFormatter(files)                        → string
     |   tablesFormatter(files)                            → string | null
     |   viewsFormatter(files)                             → string | null
     |   indexesFormatter(files)                           → string | null
     |   routinesFormatter(files)                          → string | null
     |   triggersFormatter(files)                          → string | null
     |   dmlFormatter(files)                               → string | null
     |   dropsFormatter(files)                             → string | null
     |   commentsFormatter(files)                          → string | null
     |   alterFormatter(files)                             → string | null
     |   filter(Boolean) → join("\n\n") → return string
     |
      ▼
  #generateMarkdown()
     |
     +-- readmeFormatter({ technologies, entryPoints, files, tree, projectPath })
     |       → "# Project...\n\n## Overview..."
     |       → includes: projectInfoSection, dependenciesSection, featuresSection
     |       (reads Cargo.toml or package.json directly for project data)
     |
     +-- buildModules({ files, projectPath })
     |       → groups files by directory (unique names for duplicates)
     |       → moduleFormatter({ name, files }) per group
     |       → [{ name: "aster-core-src", content: "# Module: ..." }, ...]
     |
     +-- return { readme, modules[] }
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

// Plain text output (for AI consumption):
const txt = generator.generate({ technologies, entryPoints, files });

// Markdown output (for project docs):
const { readme, modules } = generator.generate({
  technologies, entryPoints, files, tree, projectPath: "/path/to/project", format: "md"
});
```

---

## Architecture Notes

- **Single responsibility per formatter:** Each file exports one pure function. No side effects, no class dependencies.
- **Optional sections:** Formatters return `null` when no data is available; the orchestrator filters them.
- **Plain text format:** Uses `==` and `--` delimiters for sections — easy for both humans and LLMs to parse.
- **No coupling:** Formatters receive plain data and return strings. They don't know about `CodeParser`, `StructureExtractor`, or each other.
- **SQL coverage:** 9 SQL formatters match the 9 object types extracted by the SQL parser — every parsed database object appears in the output.
- **Dual output format:** Supports `txt` (flat plain text for AI) and `md` (structured markdown for project docs).
- **Markdown uses the same data pipeline:** Reuses the same `files[]` array; only the formatters differ between txt and md.
- **Module grouping:** `buildModules()` groups `files[]` by directory; each directory with parseable files becomes a `docs/<module>.md`.
