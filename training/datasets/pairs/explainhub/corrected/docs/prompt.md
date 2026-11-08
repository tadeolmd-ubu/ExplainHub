# Module: prompt

Prompt builders for Markdown generation, plain-text generation, and documentation enhancement.


## File Structure

| File | Purpose |
| ------ | ------ |
| `promptMd.js` | Builds the Markdown generation prompt from the parsed project model |
| `promptMdEnhancer.js` | Builds the production prompt that improves generated project Markdown |
| `promptTxt.js` | Builds the plain-text generation prompt from the parsed project model |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| buildPromptMd | function |  | `promptMd.js` | Builds prompt Md from the available data. |
| buildMdEnhancer | function |  | `promptMdEnhancer.js` | Builds md Enhancer from the available data. |
| buildPromptTxt | function |  | `promptTxt.js` | Builds prompt Txt from the available data. |

## Exports

| Name | Kind | File |
|------|------|------|
| buildPromptMd | function | `promptMd.js` |
| buildMdEnhancer | function | `promptMdEnhancer.js` |
| buildPromptTxt | function | `promptTxt.js` |
