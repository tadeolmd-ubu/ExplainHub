# AiEnhancer Module

## Overview

The `AiEnhancer` module takes the plain text output from `TextGenerator` and sends it to a local LLM (via Ollama) to produce a polished, narrative summary of the project in Spanish.

**Location:** `src/modules/ai-enhancer/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `AiEnhancer` class |
| `prompt/prompt.js` | Prompt template sent to the LLM |

---

## Class: `AiEnhancer`

### Constructor

Reads configuration from environment variables:
- `OLLAMA_MODEL` - Model name to use (e.g. `qwen3.5`)
- `OLLAMA_URL` (default: `"http://localhost:11434"`) - Ollama server URL

### `enhance(plainText)`

Sends the plain text analysis to the LLM and returns the full response.

**Parameters:**
- `plainText` (string) - Output from `TextGenerator.generate()`

**Returns:** `Promise<string>` - The complete AI-generated narrative report.

### Response Cleaning

Raw markdown from the LLM is cleaned:
- `**bold**` → `bold`
- `## titles` → `titles`
- `[links](url)` → `links`
- `code` → `code`
- Table rows, code fences, and `---` separators are removed

---

## Prompt Template

The prompt (`prompt/prompt.js`) wraps the analysis text with instructions for the LLM:

```
IMPORTANTE: Responde ÚNICAMENTE en español.
IMPORTANTE: Usa SOLO texto plano. NADA de markdown, ni ##, ni **, ni ---, ni tablas markdown.
Usa ==== para títulos principales, ---- para separadores, y tablas con +---+---+.
Eres un experto en análisis de código. A partir del siguiente análisis técnico, genera un informe completo con estos apartados:
1. VISIÓN GENERAL - Qué hace el proyecto, tecnologías principales, tipo de arquitectura
2. MÓDULOS Y COMPONENTES - Por cada módulo: su responsabilidad y cómo se relaciona con los demás
3. API / RUTAS - Endpoints disponibles (si aplica)
4. DEPENDENCIAS EXTERNAS - Librerías clave que usa el proyecto
5. NÚCLEO DEL PROYECTO - Archivos más importantes (los más importados), por dónde empezar a leer
6. SEGURIDAD - Prácticas observadas o faltantes
7. RECOMENDACIONES - Sugerencias para empezar a desarrollar
```

---

## Flow

```
AiEnhancer.enhance(plainText)
    |
    +-- buildPrompt(plainText)     → wrap text with instructions
    +-- ollama.generate({ model, prompt, stream: true })
    +-- collect stream chunks
    +-- cleanMarkdown(raw)        → remove markdown artifacts
    +-- return clean string
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
const summary = await enhancer.enhance(plainText);

console.log(summary);
```

---

## Architecture Notes

- **Thin wrapper:** The class is minimal — it reads config from `.env`, builds the prompt, and delegates to Ollama.
- **Streaming internally:** Collects Ollama's streaming response into a complete string before returning.
- **Markdown cleanup:** Strips common markdown syntax for clean plain text output.
- **Prompt flexibility:** The template is isolated in `prompt/prompt.js` for easy editing without touching the core logic.
- **Model-agnostic:** Works with any Ollama-compatible model. Configure via `.env`.
