# Module: utils

Filesystem utilities for traversing repositories, reading files, and saving generated results.


## File Structure

| File | Purpose |
| ------ | ------ |
| `fileUtils.js` | Filesystem helpers for traversal, reading, and saving parsed files |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| traverse | function |  | `fileUtils.js` | Traverses the tree and yields matching entries. |
| isParseable | function |  | `fileUtils.js` | Checks whether parseable applies. |
| readFile | function | yes | `fileUtils.js` | Reads a file from disk and returns its contents. |
| getFileType | function |  | `fileUtils.js` | Returns file Type from the supplied input. |
| saveFile | function |  | `fileUtils.js` | Writes file to disk. |

## Exports

| Name | Kind | File |
|------|------|------|
| traverse | function | `fileUtils.js` |
| isParseable | function | `fileUtils.js` |
| readFile | function | `fileUtils.js` |
| getFileType | function | `fileUtils.js` |
| saveFile | function | `fileUtils.js` |
