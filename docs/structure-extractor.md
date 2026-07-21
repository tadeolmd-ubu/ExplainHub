# StructureExtractor Module

## Overview

The `StructureExtractor` module performs static analysis of a project directory. It recursively builds a tree representation of the filesystem, detects technologies used in the project, and identifies entry points for each detected technology.

**Location:** `src/modules/structure-extractor/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `StructureExtractor` class |
| `techRules.js` | Technology detection rules |
| `entryRules.js` | Entry point detection rules |

---

## Class: `StructureExtractor`

### Constructor

```javascript
constructor()
```

### Methods

#### `extract(projectPath)`

Main entry point. Validates the path exists, then executes the three-phase pipeline:
1. Builds the directory tree
2. Detects technologies
3. Finds entry points

**Parameters:**
- `projectPath` (string) - Absolute path to the project directory

**Returns:**
```javascript
{
  tree: { /* recursive tree structure */ },
  technologies: ["Node.js", "TypeScript", ...],
  entryPoints: {
    "Node.js": ["index.js", "server.js"],
    ...
  }
}
```

#### `buildTree(rootPath)`

Delegates to `processNode` to start the recursive tree-building process.

#### `processNode(currentPath)`

Determines if the path is a file or directory and calls the appropriate builder method.

#### `createFileNode(currentPath)`

Creates a file node:
```javascript
{ name: "index.js", type: "file" }
```

#### `createDirectoryNode(currentPath)`

Creates a directory node with children by reading directory contents, filtering ignored items, and recursing:
```javascript
{
  name: "src",
  type: "directory",
  children: [ /* nested nodes */ ]
}
```

#### `readDirectory(dirPath)`

Wrapper around `fs.readdir` for async filesystem operations.

#### `shouldIgnore(name)`

Checks if a name is in the `ignoredNames` Set:
- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.env`
- `generated`

#### `detectTechnologies(tree)`

Traverses the tree and matches files against `techRules` (exact names and extensions). Returns an array of detected technology names.

#### `findEntryPoints(tree, technologies)`

Traverses the tree and matches files against `entryRules` for each detected technology. Returns an object mapping technology names to their entry point files.

---

## Flow / Logic

The module follows a **three-phase pipeline**:

```
extract(projectPath)
    |
    +-- Phase 1: BUILD TREE
    |       buildTree(rootPath)
    |           -> processNode(rootPath)
    |               -> If directory: createDirectoryNode()
    |                   -> readDirectory()
    |                   -> for each item:
    |                       -> shouldIgnore()? skip
    |                       -> processNode(childPath)  <-- RECURSION
    |               -> If file: createFileNode()
    |
    +-- Phase 2: DETECT TECHNOLOGIES
    |       detectTechnologies(tree)
    |           -> traverse(tree)
    |               -> For each file node:
    |                   -> Check techRules.exact[name]
    |                   -> Check techRules.extensions
    |
    +-- Phase 3: FIND ENTRY POINTS
            findEntryPoints(tree, technologies)
                -> Initialize entryPoints object per technology
                -> traverse(tree)
                    -> For each file node:
                        -> Check if name is in entryRules[tech]
```

---

## Rules Configuration

### Technology Rules (`techRules.js`)

```javascript
export const techRules = {
  exact: {
    "package.json": "Node.js",
    "requirements.txt": "Python",
    "pom.xml": "Java",
    "index.html": "Frontend",
    "Cargo.toml": "Rust",
    "go.mod": "Go",
    "Gemfile": "Ruby",
    "Gemfile.lock": "Ruby",
    "Rakefile": "Ruby",
    "*.gemspec": "Ruby",
  },
  extensions: {
    ".js": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".css": "CSS",
    ".html": "HTML",
    ".sql": "SQL",
    ".py": "Python",
    ".pyw": "Python",
    ".php": "PHP",
    ".cs": "C#",
    ".csproj": "C#",
    ".sln": "C#",
    ".xaml": "C#",
    ".rs": "Rust",
    ".java": "Java",
    ".go": "Go",
    ".c": "C",
    ".h": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".rb": "Ruby",
    ".rake": "Ruby",
    ".gemspec": "Ruby",
    ".ini": "INI",
    ".cfg": "INI",
    ".ps1": "PowerShell",
    ".psm1": "PowerShell",
  },
};
```

- **exact**: Matches exact filenames to technologies
- **extensions**: Matches file extensions to technologies

### Entry Rules (`entryRules.js`)

```javascript
export const entryRules = {
  "Node.js": ["index.js", "server.js", "app.js"],
  "Python": ["main.py", "app.py"],
  "Frontend": ["index.html"],
  "Java": ["Main.java"],
  "Rust": ["main.rs", "lib.rs"],
  "Go": ["main.go"],
  "C#": ["Program.cs", "Main.cs"],
  "C": ["main.c"],
  "C++": ["main.cpp"],
  "Ruby": ["main.rb", "app.rb", "config.ru"],
  "PowerShell": ["main.ps1"],
};
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `fs` | `node:fs/promises` | Async filesystem operations |
| `constants` | `node:fs` | File access constants (`F_OK`) |
| `path` | `node:path` | Path manipulation (`basename`, `join`, `resolve`) |
| `techRules` | `./techRules.js` | Technology detection rules |
| `entryRules` | `./entryRules.js` | Entry point detection rules |

---

## Usage Example

```javascript
import { StructureExtractor } from "./src/modules/structure-extractor/index.js";
import path from "node:path";

const extractor = new StructureExtractor();
const projectPath = path.resolve("/path/to/project");

const result = await extractor.extract(projectPath);

console.log(result.tree);           // Directory tree structure
console.log(result.technologies);   // ["Node.js", "TypeScript", ...]
console.log(result.entryPoints);    // { "Node.js": ["index.js"], ... }
```

---

## Architecture Notes

- **Separation of concerns**: Core logic lives in `index.js`, while detection rules are externalized into `techRules.js` and `entryRules.js`, making it easy to extend with new technology support.
- **Recursive tree building**: Uses depth-first traversal to construct the full directory tree.
- **Ignored directories**: Skips common build artifacts, dependencies, and configuration directories to keep analysis focused on source code.
- **Tree node types**: Two node types exist - `file` and `directory`. Directory nodes contain a `children` array of nested nodes.
