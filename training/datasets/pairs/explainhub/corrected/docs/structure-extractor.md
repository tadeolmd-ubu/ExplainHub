# Module: structure-extractor

Project scanner that builds the file tree, detects technologies, and finds entry points.


## File Structure

| File | Purpose |
| ------ | ------ |
| `entryRules.js` | Rules that identify common application entry-point files |
| `index.js` | Scans a repository and builds its tree, technologies, and entry points |
| `techRules.js` | Rules that detect technologies from file names and manifests |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| constructor | method |  | `index.js` | Initializes the instance and its internal state. |
| extract | method | yes | `index.js` | Extracts the project tree, technologies, and entry points. |
| buildTree | method | yes | `index.js` | Builds the recursive project tree from the filesystem. |
| processNode | method | yes | `index.js` | Processes one filesystem node and returns its tree entry. |
| createFileNode | method | yes | `index.js` | Creates a tree node for a regular file. |
| createDirectoryNode | method | yes | `index.js` | Creates a tree node for a directory. |
| readDirectory | method | yes | `index.js` | Reads a directory and returns its entries. |
| shouldIgnore | method |  | `index.js` | Checks whether a file or directory should be skipped. |
| detectTechnologies | method | yes | `index.js` | Detects project technologies from files and manifests. |
| traverse | arrow |  | `index.js` | Traverses the tree and yields matching entries. |
| findEntryPoints | method | yes | `index.js` | Finds common application entry-point files. |
| traverse | arrow |  | `index.js` | Traverses the tree and yields matching entries. |

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
