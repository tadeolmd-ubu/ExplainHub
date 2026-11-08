# Module: security

Path and repository-size validators that block unsafe or oversized analysis targets.


## File Structure

| File | Purpose |
| ------ | ------ |
| `index.js` | Security module entry point that re-exports the public validators |
| `pathValidator.js` | Validates and resolves paths against sensitive filesystem locations |
| `repositorySizeValidator.js` | Checks repository size and file count before analysis |
| `sensitivePath.js` | Platform-specific lists of sensitive directories and files |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| validatePath | function |  | `pathValidator.js` | Validates a user-supplied path before analysis. |
| isSensitivePath | function |  | `pathValidator.js` | Checks whether a path points at a sensitive location. |
| resolvePath | function |  | `pathValidator.js` | Resolves a path to an absolute normalized location. |
| validateRepositorySize | function | yes | `repositorySizeValidator.js` | Checks whether a repository is small enough to analyze. |
| walkDirectory | function | yes | `repositorySizeValidator.js` | Walks a directory and accumulates size statistics. |
| shouldIgnore | function |  | `repositorySizeValidator.js` | Checks whether a file or directory should be skipped. |

## Exports

| Name | Kind | File |
|------|------|------|
| validatePath | re-export | `index.js` |
| validateRepositorySize | re-export | `index.js` |
| validatePath | function | `pathValidator.js` |
| resolvePath | function | `pathValidator.js` |
| validateRepositorySize | function | `repositorySizeValidator.js` |
| linux | const | `sensitivePath.js` |
| windows | const | `sensitivePath.js` |
| macOs | const | `sensitivePath.js` |
