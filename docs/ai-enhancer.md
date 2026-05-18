# AiEnhancer Module

## Overview

The `AiEnhancer` module takes the plain text output from `TextGenerator` and sends it to a local LLM (via Ollama) to produce a polished, narrative summary of the project.

**Location:** `src/modules/ai-enhancer/`

---

## File Structure

| File | Purpose |
|------|---------|
| `index.js` | Core `AiEnhancer` class |
| `promt/promt.js` | Prompt template sent to the LLM |

---

## Class: `AiEnhancer`

### Constructor

Reads configuration from environment variables:
- `OLLAMA_MODEL` (default: `"qwen3.5"`) - Model name to use
- `OLLAMA_URL` (default: `"http://127.0.0.1:11434"`) - Ollama server URL

### `enhance(plainText)`

Sends the plain text analysis to the LLM and returns a streaming response.

**Parameters:**
- `plainText` (string) - Output from `TextGenerator.generate()`

**Returns:** `AsyncIterable` - Stream of response chunks from Ollama.

Each chunk has a `response` property with the generated text fragment.

---

## Prompt Template

The prompt (`promt.js`) wraps the analysis text with instructions for the LLM:

```
IMPORTANTE: Responde ÚNICAMENTE en español.
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
    +-- buildPrompt(plainText)  →  wrap text with instructions
    +-- ollama.generate({ model, prompt, stream: true })
    +-- return AsyncIterable<{ response: string }>
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
const stream = await enhancer.enhance(plainText);

for await (const part of stream) {
  process.stdout.write(part.response);
}
```

---

## Architecture Notes

- **Thin wrapper:** The class is minimal — it reads config from `.env`, builds the prompt, and delegates to Ollama.
- **Streaming by design:** Returns an async iterable so consumers can show output progressively.
- **Prompt flexibility:** The template is isolated in `promt.js` for easy editing without touching the core logic.
- **Model-agnostic:** Works with any Ollama-compatible model. Configure via `.env`.
