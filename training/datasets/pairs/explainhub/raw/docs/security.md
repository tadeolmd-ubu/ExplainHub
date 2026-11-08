# Module: security


## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Module entry point |
| `pathValidator.js` | JavaScript module |
| `repositorySizeValidator.js` | JavaScript module |
| `sensitivePath.js` | JavaScript module |

## Functions

| Name | Kind | Async | File |
|------|------|-------|------|
| validatePath | function |  | `pathValidator.js` |
| isSensitivePath | function |  | `pathValidator.js` |
| resolvePath | function |  | `pathValidator.js` |
| validateRepositorySize | function | yes | `repositorySizeValidator.js` |
| walkDirectory | function | yes | `repositorySizeValidator.js` |
| shouldIgnore | function |  | `repositorySizeValidator.js` |

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