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
| `prompt/promptMd.js` | Prompt template for Markdown output |

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

### Response Cleaning

Raw markdown from the LLM is cleaned:
- `**bold**` → `bold`
- `## titles` → `titles`
- `[links](url)` → `links`
- `code` → `code`
- Table rows, code fences, and `---` separators are removed

---

## Prompt Templates

There are two prompt files, chosen by the `format` parameter:

**`promptTxt.js`** — instructs the model to return plain text with `----` separators.

**`promptMd.js`** — instructs the model to return Markdown with `##` titles, **bold**, `code`, and tables.

Both share the same structure but differ in the formatting instruction at the end.

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
- **Dual prompt templates:** `promptTxt.js` and `promptMd.js` let the user choose between plain text and Markdown output.
- **Markdown passthrough:** When using md format, `cleanMarkdown` is skipped to preserve the Markdown syntax.
- **Model-agnostic:** Works with any Ollama-compatible model. Configure via `.env`.
