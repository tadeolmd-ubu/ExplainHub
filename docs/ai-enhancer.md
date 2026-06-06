# AiEnhancer Module

## Overview

The `AiEnhancer` module takes the plain text output from `TextGenerator` and sends it to a local LLM (via Ollama) to produce a polished, narrative summary of the project in Spanish.

**Location:** `src/modules/ai-enhancer/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `AiEnhancer` class |
| `prompt/promptTxt.js` | Prompt template for plain text output |
| `prompt/promptMd.js` | Prompt template for Markdown output (from plain text) |
| `prompt/promptMdEnhancer.js` | Prompt template for improving existing Markdown |

---

## Class: `AiEnhancer`

### Constructor

Reads configuration from environment variables:
- `OLLAMA_MODEL` - Model name to use (e.g. `qwen3.5`)
- `OLLAMA_URL` (default: `"http://localhost:11434"`) - Ollama server URL

### `enhance(plainText, format)`

Sends the plain text analysis to the LLM and returns the full response.

**Parameters:**
- `plainText` (string) - Output from `TextGenerator.generate()`
- `format` (string) - `"txt"` or `"md"` — selects which prompt template to use

**Returns:** `Promise<string>` - The complete AI-generated narrative report in txt or md.

### `enhanceMarkdown(markdown)`

Improves an existing Markdown document by sending it to the LLM with a polish prompt. Used by the `md` output format to enrich README.md and module docs.

**Parameters:**
- `markdown` (string) - Pre-generated Markdown content (from markdown formatters)

**Returns:** `Promise<string>` - The improved Markdown with better wording and formatting.

### Response Cleaning

Raw markdown from the LLM is cleaned:
- `**bold**` → `bold`
- `## titles` → `titles`
- `[links](url)` → `links`
- `code` → `code`
- Table rows, code fences, and `---` separators are removed

---

## Prompt Templates

There are three prompt files, chosen depending on the format and use case:

**`promptTxt.js`** — instructs the model to return plain text with `----` separators.

**`promptMd.js`** — instructs the model to return Markdown with `##` titles, **bold**, `code`, and tables.

**`promptMdEnhancer.js`** — instructs the model to improve existing Markdown without inventing information. Used by `enhanceMarkdown()` to polish README.md and module docs.

---

## Flow

```
AiEnhancer.enhance(plainText, format)
    |
    +-- buildPrompt[format](plainText)  → choose txt or md prompt
    +-- ollama.generate({ model, prompt, stream: true })
    +-- collect stream chunks
    +-- if txt: cleanMarkdown(raw)      → remove markdown artifacts
    +-- if md: return raw               → keep markdown

AiEnhancer.enhanceMarkdown(markdown)
    |
    +-- buildMdEnhancer(markdown)       → prompt to polish existing md
    +-- ollama.generate({ model, prompt, stream: true })
    +-- collect stream chunks
    +-- return raw                      → improved markdown
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `ollama` | npm (ollama) | Official Ollama JavaScript client |

---

## Usage Example

```javascript
import { AiEnhancer } from "./src/modules/ai-enhancer/index.js";
import { TextGenerator } from "./src/modules/text-generator/index.js";

const generator = new TextGenerator();
const plainText = generator.generate({ technologies, entryPoints, files });

const enhancer = new AiEnhancer();
const summary = await enhancer.enhance(plainText, "md"); // or "txt"

console.log(summary);
```

---

## Architecture Notes

- **Thin wrapper:** The class is minimal — it reads config from `.env`, builds the prompt, and delegates to Ollama.
- **Streaming internally:** Collects Ollama's streaming response into a complete string before returning.
- **Markdown cleanup:** Strips common markdown syntax for clean plain text output.
- **Three prompt templates:** `promptTxt.js`, `promptMd.js`, and `promptMdEnhancer.js` for different enhancement scenarios.
- **Markdown passthrough:** When using md format, `cleanMarkdown` is skipped to preserve the Markdown syntax.
- **`enhanceMarkdown` passthrough:** Returns raw markdown output (no cleanup), since the input is already markdown.
- **Model-agnostic:** Works with any Ollama-compatible model. Configure via `.env`.
