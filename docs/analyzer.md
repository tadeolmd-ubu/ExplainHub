# AnalyzerService

## Overview

The `AnalyzerService` orchestrates the full ExplainHub pipeline. It accepts a repository URL or local path, runs every module sequentially, and returns a final summary.

**Location:** `src/core/analyzer/`

---

## File Structure

| File | Purpose |
|------|---------|
| `analyzer.service.js` | Core `AnalyzerService` class |

---

## Class: `AnalyzerService`

### `analyze(input, format)`

Runs the complete analysis pipeline.

**Parameters:**
- `input` (string) - Git remote URL, local filesystem path, or `.zip` file path
- `format` (string) - `"txt"` or `"md"` (default: `"txt"`)

**Returns:**
```javascript
{
  summary: string,       // AI-enhanced narrative in txt, or "Document generated: N files" for md
  repoPath: string       // Path to the project (cloned or local) — useful for CLI navigation
}
```

### Pipeline Logic

1. **Input detection**: If the input looks like a remote URL (`http://`, `https://`, `git@`, `git://`), it's cloned via `RepositoryCloner`. If it ends with `.zip`, it's extracted. Otherwise, it's treated as a local path.

2. **Security validation** (local paths only):
   - `validatePath()` — rejects sensitive system directories
   - `validateRepositorySize()` — rejects projects that are too large or have too many files

3. **StructureExtractor.extract()** → `{ tree, technologies, entryPoints }`

4. **CodeParser.parse(tree, projectPath)** → `files[]`

5. **Two output paths:**

   **`format === "txt"`** (default):
   - `TextGenerator.generate({ technologies, entryPoints, files })` → `plainText`
   - `AiEnhancer.enhance(plainText, format)` → `summary` (txt or md)
   - If AI enhancement fails, plain text is returned as the summary.
   - CLI shows result and optionally saves to a `.txt`/`.md` file.

   **`format === "md"`**:
   - `TextGenerator.generate({ technologies, entryPoints, files, tree, projectPath, format: "md" })` → `{ readme, modules[] }`
   - If `OLLAMA_MODEL` is configured: `enhancer.enhanceMarkdown()` improves README and each module doc via AI (with `[N/total]` progress log per module)
   - `writeDocs()` writes `README.md` and `docs/<module>.md` to the project directory
   - CLI skips the save prompt (docs are already on disk)
   - Works with both local paths and remote repos (cloned repos are kept after analysis)

6. **Cleanup**: Only `.zip` extractions are cleaned up after processing. Cloned remote repositories are **kept** on disk so the user can navigate to the project directory and find the generated docs inside it.

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
| TextGenerator | `../modules/text-generator/` | Plain text / markdown generation |
| AiEnhancer | `../modules/ai-enhancer/` | AI enhancement |
| config | `../config/env.js` | Environment config (OLLAMA_MODEL, etc.) |
| validatePath | `../modules/security/` | Path security validation |
| validateRepositorySize | `../modules/security/` | Size limit validation |

---

## Flow Diagram

```
CLI (explain)  or  POST /api/analyze { projectPath }
                |
                ▼
        AnalyzerService.analyze(projectPath, format)
                |
                +-- Is .zip? ──Yes──► RepositoryCloner.extractZip()
                |                          (cleaned up after processing)
                |
                +-- Is remote URL? ──Yes──► RepositoryCloner.clone()
                |                                   |
                |                              repoPath (kept on disk)
                |
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
        format === "md" ?
                |
         ┌──────┴──────┐
         ▼              ▼
        Yes             No
         |              |
         |              ▼
         |       TextGenerator.generate()
         |         (technologies, entryPoints, files)
         |              |
         |              ▼
         |       AiEnhancer.enhance(plainText, format)
         |              |
         |              ▼
         |       CLI: show result → confirm save
         |
         ▼
  TextGenerator.generate()
  (format: "md", with tree + projectPath)
         |
         ▼
  { readme, modules[] }
         |
         +-- OLLAMA_MODEL set? ──Yes──► enhancer.enhanceMarkdown()
         |                                   (readme + each module)
         |
         ▼
  writeDocs(projectPath, readme, modules)
         |
         ▼
  README.md + docs/<module>.md written to disk
  (project directory kept on disk for remote repos)
```

---

## Architecture Notes

- **Orchestration pattern:** `AnalyzerService` coordinates all modules without knowing their internal implementation.
- **Dual output paths:** `txt` format produces an AI-enhanced narrative (or plain text fallback). `md` format writes `README.md` + `docs/*.md` directly to the project.
- **AI is optional for markdown:** If `OLLAMA_MODEL` is not set, markdown docs are generated from the deterministic formatters without AI calls.
- **Fallback on AI failure:** For `txt` format, if Ollama is unavailable or returns an error, the plain text is used as the summary.
- **Remote repos kept on disk:** Cloned repositories are not deleted after processing. The generated docs are written inside the cloned directory, and the CLI prints the path so the user can navigate there.
- **Zip cleanup:** Only `.zip` extractions are cleaned up after processing (they're temporary by nature).
- **Dual input mode:** Accepts remote URLs, local paths, and `.zip` files transparently.
- **Markdown works everywhere:** Both local and remote repos can generate markdown docs.
