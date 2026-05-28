# AnalyzerService

## Overview

The `AnalyzerService` orchestrates the full ExplainHub pipeline. It accepts a repository URL or local path, runs every module sequentially, and returns a final summary.

**Location:** `src/core/analyzer/`

---

## File Structure

| File | Purpose |
|------|---------|
| `analyzer.service.js` | Core `AnalyzerService` class |
| `analyzer.routes.js` | Express route definitions |

---

## Class: `AnalyzerService`

### `analyze(input)`

Runs the complete analysis pipeline.

**Parameters:**
- `input` (string) - Git remote URL or local filesystem path

**Returns:**
```javascript
{
  summary: string,       // AI-enhanced narrative (or plain text fallback)
  plainText: string,     // Raw TextGenerator output
  technologies: string[],
  files: FileResult[]
}
```

### Pipeline Logic

1. **Input detection**: If the input looks like a remote URL (`http://`, `https://`, `git@`, `git://`), it's cloned via `RepositoryCloner`. Otherwise, it's treated as a local path.

2. **Security validation** (local paths only):
   - `validatePath()` — rejects sensitive system directories
   - `validateRepositorySize()` — rejects projects that are too large or have too many files

3. **StructureExtractor.extract()** → `{ tree, technologies, entryPoints }`

4. **CodeParser.parse(tree, projectPath)** → `files[]`

5. **TextGenerator.generate({ technologies, entryPoints, files })** → `plainText`

6. **AiEnhancer.enhance(plainText)** → `summary`

7. **Auto-cleanup**: If the repo was cloned, `cloner.cleanup()` removes the temp directory.

If AI enhancement fails, the plain text is returned as the summary.

---

## CLI Usage

The service is consumed by the interactive CLI (`src/modules/cli/`):

```bash
explain
```

Select "Url en la nube", "Ruta en los archivos", or ".zip" and follow the prompts.

---

## Legacy API Endpoint

### `POST /api/analyze`

**Request:**
```json
{ "projectPath": "https://github.com/user/repo.git" }
```

**Response:**
```json
{ "summary": "..." }
```

---

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| RepositoryCloner | `../modules/cloner/` | Git clone |
| StructureExtractor | `../modules/structure-extractor/` | File tree analysis |
| CodeParser | `../modules/code-parser/` | Source code parsing |
| TextGenerator | `../modules/text-generator/` | Plain text generation |
| AiEnhancer | `../modules/ai-enhancer/` | AI enhancement |
| validatePath | `../modules/security/` | Path security validation |
| validateRepositorySize | `../modules/security/` | Size limit validation |

---

## Flow Diagram

```
CLI (explain)  or  POST /api/analyze { projectPath }
                |
                ▼
        AnalyzerService.analyze(projectPath)
                |
                +-- Is remote URL? ──Yes──► RepositoryCloner.clone(url)
                |                                   |
                |                              repoPath
                |                                   |
                |                              (auto-cleaned in finally)
                |                                   |
                +-- No (local path) ──► validatePath()
                |                           validateRepositorySize()
                |
                ▼
        StructureExtractor.extract(projectPath) ──► { tree, technologies, entryPoints }
                |
                ▼
        CodeParser.parse(tree, projectPath) ──► files[]
                |
                ▼
        TextGenerator.generate({ technologies, entryPoints, files }) ──► plainText
                |
                ▼
        AiEnhancer.enhance(plainText) ──► summary (or plainText fallback)
                |
                ▼
        Return { summary, plainText, technologies, files }
```

---

## Architecture Notes

- **Orchestration pattern:** `AnalyzerService` coordinates all modules without knowing their internal implementation.
- **Fallback on AI failure:** If Ollama is unavailable or returns an error, the plain text is used as the summary.
- **Automatic cleanup:** Cloned repositories are always removed after processing, even if an error occurs.
- **Dual input mode:** Accepts both remote URLs and local paths transparently.
