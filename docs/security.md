# Security Module

## Overview

The Security module provides validation guards for the project analysis pipeline. It prevents processing of sensitive system directories and rejects projects that are too large to analyze.

**Location:** `src/modules/security/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Module entry point (re-exports) |
| `pathValidator.js` | Validates project paths against sensitive directories |
| `sensitivePath.js` | Lists of sensitive system paths (Linux, Windows, macOS) |
| `repositorySizeValidator.js` | Validates repository size (total size, file count, individual file size) |

---

## `validatePath(input)`

Validates that the given path is not a sensitive system directory.

```javascript
import { validatePath } from "../modules/security/index.js";

const result = validatePath("/home/user/projects/myapp");
// { safe: true, resolved: "/home/user/projects/myapp" }

const result2 = validatePath("/etc/passwd");
// { safe: false, resolved: "/etc/passwd", reason: '"/etc/passwd" es un directorio sensible' }
```

**Returns:**
```javascript
{
  safe: boolean,
  resolved: string,     // resolved absolute path
  reason?: string       // present only when safe is false
}
```

### Sensitive Paths

The module checks against three operating system sets:

**Linux:** `/etc`, `/proc`, `/sys`, `/dev`, `/boot`, `/bin`, `/sbin`, `/lib`, `/lib64`, `/usr`, `/var`, `/opt`, `/root`

**Windows:** `C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, `C:\System32`, `C:\Boot`, `C:\Recovery`

**macOS:** `/System`, `/Library`, `/private`, `/cores`, `/Volumes`

Resolves `~` to the user's home directory before checking.

---

## `validateRepositorySize(projectPath)`

Walks the project directory tree and validates against three limits:

| Limit | Default | Description |
|-------|---------|-------------|
| `maxFiles` | 5,000 | Maximum number of files |
| `maxFileSize` | 5 MB | Maximum size for any individual file |
| `maxProjectSize` | 100 MB | Maximum total project size |

Skips directories listed in `ignoredNames` (shared with `StructureExtractor`).

```javascript
import { validateRepositorySize } from "../modules/security/index.js";

const result = await validateRepositorySize("/path/to/project");

// Success:
{ safe: true, totalSize: 1234567, fileCount: 42, oversizedFiles: [] }

// Failure (too large):
{ safe: false, reason: "El proyecto excede los 100 MB (150.23 MB)" }

// Failure (too many files):
{ safe: false, reason: "El proyecto excede los 5000 archivos (7234)" }
```

---

## Integration

The security module is used by `AnalyzerService` for local project paths:

```javascript
import { validatePath, validateRepositorySize } from "../../modules/security/index.js";

// Before processing a local path:
const { safe, reason } = validatePath(input);
if (!safe) throw new Error(reason);

const sizeResult = await validateRepositorySize(projectPath);
if (!sizeResult.safe) throw new Error(sizeResult.reason);
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `fs` | `node:fs/promises` | Directory walking and file stats |
| `path` | `node:path` | Path resolution |
| `os` | `node:os` | Home directory resolution for `~` |
| `ignoredNames` | `../structure-extractor/index.js` | Shared ignore list |

---

## Architecture Notes

- **Defense in depth:** Validates both the path (against sensitive directories) and the size (against resource limits).
- **Shared ignore list:** Reuses `ignoredNames` from `StructureExtractor` to skip `node_modules`, `.git`, etc.
- **Cross-platform:** Sensitive path lists for Linux, Windows, and macOS are all checked regardless of the host OS.
- **Fail-safe:** Returns structured results with `safe` boolean and `reason` string — never throws unexpectedly.
