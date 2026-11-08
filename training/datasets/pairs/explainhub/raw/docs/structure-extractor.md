# Module: structure-extractor


## File Structure

| File | Purpose |
|------|---------|
| `entryRules.js` | JavaScript module |
| `index.js` | Module entry point |
| `techRules.js` | JavaScript module |

## Functions

| Name | Kind | Async | File |
|------|------|-------|------|
| constructor | method |  | `index.js` |
| extract | method | yes | `index.js` |
| buildTree | method | yes | `index.js` |
| processNode | method | yes | `index.js` |
| createFileNode | method | yes | `index.js` |
| createDirectoryNode | method | yes | `index.js` |
| readDirectory | method | yes | `index.js` |
| shouldIgnore | method |  | `index.js` |
| detectTechnologies | method | yes | `index.js` |
| traverse | arrow |  | `index.js` |
| findEntryPoints | method | yes | `index.js` |
| traverse | arrow |  | `index.js` |

## Classes

| Name | Extends | File |
|------|---------|------|
| StructureExtractor | - | `index.js` |

## Exports

| Name | Kind | File |
|------|------|------|
| entryRules | const | `entryRules.js` |
| ignoredNames | const | `index.js` |
| StructureExtractor | class | `index.js` |
| techRules | const | `techRules.js` |