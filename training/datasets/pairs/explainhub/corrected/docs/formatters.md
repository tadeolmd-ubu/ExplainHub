# Module: formatters

Shared formatting helpers used by the text and Markdown documentation generators.


## File Structure

| File | Purpose |
| ------ | ------ |
| `utils.js` | Shared helpers for empty-file checks and repeated-name counting |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| isEmptyFile | function |  | `utils.js` | Checks whether a file has no meaningful content. |
| buildNameCount | function |  | `utils.js` | Builds a frequency map of repeated names. |

## Exports

| Name | Kind | File |
|------|------|------|
| METADATA_KEYS | const | `utils.js` |
| isEmptyFile | function | `utils.js` |
| buildNameCount | function | `utils.js` |
