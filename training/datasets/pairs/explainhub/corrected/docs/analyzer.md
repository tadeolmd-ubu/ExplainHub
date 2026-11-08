# Module: analyzer

Service layer that clones a repository, parses its files, and writes the generated documentation.


## File Structure

| File | Purpose |
| ------ | ------ |
| `analyzer.service.js` | Service that coordinates cloning, parsing, and documentation output |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| analyze | method | yes | `analyzer.service.js` | Analyzes a project and returns the generated documentation. |
| writeDocs | function | yes | `analyzer.service.js` | Writes generated documents into a snapshot directory. |

## Classes

| Name | Extends | File |
|------|---------|------|
| AnalyzerService | - | `analyzer.service.js` |

## Exports

| Name | Kind | File |
|------|------|------|
| AnalyzerService | class | `analyzer.service.js` |
