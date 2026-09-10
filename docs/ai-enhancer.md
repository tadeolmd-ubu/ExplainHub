# AiEnhancer

Configuration is centralized in `src/config/env.js`: `OLLAMA_URL`, optional
`OLLAMA_MODEL`, and `OLLAMA_TIMEOUT_MS` (60,000 by default). The service bypasses
AI when no model is configured or when `options.ai` is false.

`enhance(text, "txt", language)` returns a narrative in the selected language.
`enhanceMarkdown(markdown, language)` requests JSON containing a description,
validates it, and inserts a labeled blockquote after the document title.
All original Markdown facts, tables, headings, paragraphs and code remain intact.
The model no longer rewrites extracted tables or links.

`postProcess` only trims surrounding whitespace, restores a nonempty original
when needed, and normalizes the final newline. It never removes trailing prose
or merges repeated headings.

Each request is cancellable through the Ollama client and has a timeout, an input
budget of 120,000 characters and an output budget of 1 MiB of string characters.
Markdown service-level enrichment additionally has a two-minute budget and stops
after the first failure. Empty responses, malformed JSON, missing descriptions,
timeouts and budget failures become diagnostics with deterministic fallback.

The constructor accepts `{ client, model, timeoutMs }` for meaningful isolated
tests. `test/ai-enhancer.test.js` exercises stalled requests, malformed/empty
responses, language instructions and complete preservation of source content.
No real model is needed for automated tests. A generated description remains an
AI interpretation rather than proof of runtime behavior.
