# Module: code-parser

Parser facade that selects the right language parser and returns a normalized file model.


## File Structure

| File | Purpose |
| ------ | ------ |
| `fileTypes.js` | Maps file extensions to parser and language identifiers |
| `index.js` | Parser facade that selects a language parser and normalizes results |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| parse | method | yes | `index.js` | Parses project files and returns the normalized document model. |

## Classes

| Name | Extends | File |
|------|---------|------|
| CodeParser | - | `index.js` |

## Exports

| Name | Kind | File |
|------|------|------|
| fileTypes | const | `fileTypes.js` |
| saveFile | re-export | `index.js` |
| CodeParser | class | `index.js` |
