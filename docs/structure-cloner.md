# RepositoryCloner Module

## Overview

The `RepositoryCloner` module handles cloning remote and local Git repositories into a managed temporary directory. It validates the repository URL, generates a unique folder per clone, and automatically cleans up if the operation fails.

**Location:** `src/modules/cloner/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `RepositoryCloner` class |
| `test/test.js` | Usage example / test script |

---

## Class: `RepositoryCloner`

### Constructor

```javascript
constructor(options = {})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options.baseTempDir` | `string` | `<cwd>/temp` | Root folder where clones are stored |
| `options.gitOptions` | `object` | `{}` | Extra options passed to `simple-git` |

Initializes `this.baseTempDir` and creates a `simple-git` instance bound to the current working directory.

### Methods

#### `clone(repositoryUrl)`

Main entry point. Validates the URL, prepares the folder structure, and executes the clone.

**Parameters:**
- `repositoryUrl` (string) - URL or local path of the Git repository

**Returns:**
```javascript
{
  repositoryUrl: string,  // validated and trimmed URL
  tempPath: string,       // container folder for this clone
  repoPath: string,       // folder where the source code lives
  cloneId: string,        // unique identifier for this clone
}
```

**Throws** if the URL format is not supported or if Git cannot complete the clone.

---

#### `validateRepositoryUrl(repositoryUrl)`

Checks that the input is a non-empty string and matches a recognized format. Returns the trimmed URL.

**Accepted formats:**

| Type | Example |
|------|---------|
| HTTPS | `https://github.com/user/repo.git` |
| HTTP | `http://gitlab.internal/repo` |
| SSH explicit | `ssh://git@server.com/repo.git` |
| SSH shorthand | `git@github.com:user/repo.git` |
| Git protocol | `git://git.kernel.org/linux.git` |
| Relative path | `./other-repo` · `../neighbor` |
| Absolute path | `/home/user/repos/myrepo` · `C:\repos\myrepo` |

---

#### `ensureBaseTempDirectory()`

Creates the `/temp` root folder if it does not exist. Safe to call multiple times (idempotent).

---

#### `createCloneId(repositoryUrl)`

Generates a unique, human-readable identifier for the clone folder.

**Format:** `<ISO-timestamp>-<repo-name>`

```
https://github.com/facebook/react.git  →  2025-05-03T10-30-00-000Z-react
```

Delegates to `extractRepositoryName` to parse the repo name from the URL.

---

#### `extractRepositoryName(repositoryUrl)`

Parses the last meaningful segment from the URL and sanitizes it for use as a folder name. Strips `.git` suffix and replaces special characters with `-`.

---

#### `cleanup(targetPath)`

Recursively deletes a temporary folder. Called automatically when a clone fails to prevent orphaned directories.

---

#### `isSupportedRemoteUrl(repositoryUrl)`

Returns `true` if the URL starts with a recognized remote scheme (`https://`, `http://`, `git://`, `ssh://`) or matches the SSH shorthand pattern (`user@host:path`).

---

#### `isLikelyLocalPath(repositoryUrl)`

Returns `true` if the input looks like a local filesystem path: relative paths (`./`, `../`), Unix absolute paths, or Windows absolute paths (`C:\`).

---

## Flow / Logic

The module follows a **three-phase pipeline**:

```
clone(repositoryUrl)
    |
    +-- Phase 1: VALIDATE
    |       validateRepositoryUrl()
    |           -> isSupportedRemoteUrl()?  accept
    |           -> isLikelyLocalPath()?     accept
    |           -> neither?                 throw Error
    |
    +-- Phase 2: PREPARE
    |       ensureBaseTempDirectory()       -> mkdir /temp
    |       createCloneId()
    |           -> extractRepositoryName()  -> parse last URL segment
    |       mkdir(tempPath)                 -> create clone container
    |
    +-- Phase 3: CLONE
            git.clone(url, repoPath, ["--depth", "1"])
                -> success: return { repositoryUrl, tempPath, repoPath, cloneId }
                -> failure: cleanup(tempPath) -> throw Error
```

---

## Folder Structure Generated

```
temp/
└── 2025-05-03T10-30-00-000Z-react/   ← tempPath (clone container)
    └── repository/                    ← repoPath (source code lives here)
```

The container folder exists to allow metadata, logs, or analysis results to be stored alongside the repository without mixing with the source code.

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `fs` | `node:fs/promises` | Async folder creation and deletion |
| `path` | `node:path` | Cross-platform path construction |
| `simpleGit` | `simple-git` | Executes Git commands as promises |

---

## Usage Example

```javascript
import { RepositoryCloner } from "./src/modules/cloner/index.js";

const cloner = new RepositoryCloner();

const result = await cloner.clone("https://github.com/facebook/react");

console.log(result.repoPath);    // /project/temp/2025-05-03T...-react/repository
console.log(result.cloneId);     // 2025-05-03T10-30-00-000Z-react
```

---

## Test

```bash
node test/test.js https://github.com/user/repo
```

---

## Architecture Notes

- **Single responsibility per method:** each method does exactly one thing, making isolated changes and testing straightforward.
- **Fail fast:** URL validation runs before any filesystem or network operation.
- **Automatic cleanup:** the `try/catch` in `clone()` guarantees no orphaned folders remain in `/temp` if the operation fails.
- **Shallow clone:** `--depth 1` downloads only the latest commit, keeping the process fast and lightweight for source code analysis.
- **Flexible configuration:** the constructor accepts optional overrides without requiring them, making the class easy to use in both production and test environments.