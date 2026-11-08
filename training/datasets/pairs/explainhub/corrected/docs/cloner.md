# Module: cloner

Repository cloner that validates URLs, extracts ZIP archives, and manages temporary directories.


## File Structure

| File | Purpose |
| ------ | ------ |
| `index.js` | Repository cloner with URL validation, ZIP extraction, and cleanup |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| constructor | method |  | `index.js` | Initializes the instance and its internal state. |
| clone | method | yes | `index.js` | Clones a repository into a temporary working directory. |
| validateRepositoryUrl | method |  | `index.js` | Validates a remote repository URL before cloning. |
| ensureBaseTempDirectory | method | yes | `index.js` | Creates the base temporary directory when needed. |
| cleanup | method | yes | `index.js` | Removes temporary files created during cloning. |
| extractRepositoryName | method |  | `index.js` | Extracts a repository name from a URL or path. |
| isSupportedRemoteUrl | method |  | `index.js` | Checks whether a remote URL uses a supported protocol. |
| isLikelyLocalPath | method |  | `index.js` | Checks whether an input looks like a local filesystem path. |
| extractZip | method | yes | `index.js` | Extracts a ZIP archive into the working directory. |
| safeZipEntryName | method |  | `index.js` | Sanitizes a ZIP entry name to prevent path traversal. |

## Classes

| Name | Extends | File |
|------|---------|------|
| RepositoryCloner | - | `index.js` |

## Exports

| Name | Kind | File |
|------|------|------|
| RepositoryCloner | class | `index.js` |
