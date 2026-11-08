# Module: ai-enhancer

Ollama-backed enhancer that rewrites generated Markdown with the production enhancement prompt.


## File Structure

| File | Purpose |
| ------ | ------ |
| `index.js` | Ollama client wrapper that enhances Markdown and strips code fences |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| cleanMarkdown | function |  | `index.js` | Implements the clean Markdown helper used by this module. |
| stripCodeBlock | function |  | `index.js` | Strips code Block from the input. |
| postProcess | function |  | `index.js` | Implements the post Process helper used by this module. |
| normalizeTables | function |  | `index.js` | Normalizes tables into a canonical form. |
| parseSections | function |  | `index.js` | Parses sections input into the shared document model. |
| sectionKey | function |  | `index.js` | Implements the section Key helper used by this module. |
| dataRowCount | function |  | `index.js` | Implements the data Row Count helper used by this module. |
| dedupeRows | function |  | `index.js` | Implements the dedupe Rows helper used by this module. |
| alignSections | function |  | `index.js` | Implements the align Sections helper used by this module. |
| removeTrailingProse | function |  | `index.js` | Implements the remove Trailing Prose helper used by this module. |
| constructor | method |  | `index.js` | Initializes the instance and its internal state. |
| enhance | method | yes | `index.js` | Implements the enhance helper used by this module. |
| enhanceMarkdown | method | yes | `index.js` | Implements the enhance Markdown helper used by this module. |

## Classes

| Name | Extends | File |
|------|---------|------|
| AiEnhancer | - | `index.js` |

## Exports

| Name | Kind | File |
|------|------|------|
| postProcess | named | `index.js` |
| stripCodeBlock | named | `index.js` |
| AiEnhancer | class | `index.js` |
