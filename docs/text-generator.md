# TextGenerator

```js
generator.generate({ technologies, entryPoints, files, tree, projectPath,
  projectName, format: "md", language: "es" });
```

TXT returns a string. Markdown returns `{ readme, modules: [{ name, content }] }`.
The generator does not write documents. `writeDocs.js` performs explicit output
under a fresh `report-*` directory, returns its paths and removes partial output
if writing fails. Source documentation is never overwritten.

## Components

- `moduleCatalog.js`: one shared catalog for README links and module documents.
  Names use SHA-256 of full relative directory paths, avoiding basename collisions
  and unbounded filenames. Root-level sources receive a `root` document.
- `metadata.js`: reads package.json once per Markdown generation, rejects symlinks
  and oversized metadata, and supplies data to renderers.
- `formatters/md/readme.js`: project name, overview, verified startup script,
  project metadata, dependencies, Cargo features, file tree, modules and schema.
- `formatters/md/modules.js`: files, functions, classes, exports, routes and SQL
  objects. PHP files use a neutral language description rather than speculative
  business functionality derived from their names.
- `formatters/txt/*`: sections of the deterministic plain-text report.
- `localize.js`: English/Spanish presentation labels, preserving code, identifiers
  and source-provided descriptions. Technical type names may remain in English.

Startup instructions come from an actual `scripts.start` or `scripts.dev` in
package.json. When startup cannot be verified, the report says so instead of
inventing a main.py, Spring Boot application or npm script.

Empty extracted declarations are labeled "No declarations detected", not
"unimplemented": absence of recognized symbols does not imply an empty program.
Optional AI enrichment preserves every original Markdown fact and adds a labeled
description. See [AiEnhancer](ai-enhancer.md).
