# ExplainHub

explainHub analyzes any Git repository — clones it, parses its source code via AST, and generates a structured plain-text summary. Optionally enhances the summary with a local LLM (Ollama) to produce a polished narrative report in Spanish or Markdown.

---

## Pipeline

```
Repository (local or remote)
    │
    ▼
RepositoryCloner      →  Clones repo to temp directory
    │
    ▼
StructureExtractor    →  Builds file tree, detects technologies & entry points
    │
    ▼
CodeParser            →  Parses JS/TS/HTML/CSS with @babel/parser AST
                        Extracts imports, exports, functions, classes, routes
    │
    ▼
TextGenerator         →  Transforms analysis data into plain text sections
    │
    ▼
AiEnhancer            →  Sends plain text to local LLM (Ollama)
                        Returns a narrative report in txt or md
    │
    ▼
Output                →  Console + optional save to .txt/.md file
```

---

## Features

| Step | Module | What it does |
|------|--------|-------------|
| 1 | RepositoryCloner | Clones remote or local repos into `/temp` |
| 2 | StructureExtractor | Builds recursive file tree, detects tech stack |
| 3 | CodeParser | Parses JS/TS/HTML/CSS via `@babel/parser` AST |
| 4 | TextGenerator | Produces structured plain text report |
| 5 | AiEnhancer | Sends report to Ollama for AI-powered summary in txt or md |
| — | Security | Validates paths and repository size before processing |
| — | CLI | Interactive menu: URL, local path, .zip, format selection, save to file |

---

## Installation

```bash
git clone https://github.com/tadeolmd-ubu/ExplainHub.git
cd ExplainHub
npm install
npm link
```

### Install Ollama (optional, for AI enhancement)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (e.g., gemma4 or qwen3.5)
ollama pull gemma4

# Start Ollama server
ollama serve
```

### Environment Variables

Copy `.env.example` to `.env`:

```env
OLLAMA_MODEL=gemma4
OLLAMA_URL=http://localhost:11434
```

---

## Quick Start

### 1. Analyze a project with the CLI

```bash
explain
```

Follow the prompts: select input type (URL, local path, .zip), choose format (txt/md), and optionally save the result to a file.

### 2. Run tests

```bash
node --test test/.test.js
```

Requires Ollama running for the AI enhancer test.

---

## Module Documentation

| Module | Docs | Source |
|--------|------|--------|
| RepositoryCloner | [docs/structure-cloner.md](docs/structure-cloner.md) | `src/modules/cloner/` |
| StructureExtractor | [docs/structure-extractor.md](docs/structure-extractor.md) | `src/modules/structure-extractor/` |
| CodeParser | [docs/code-parser.md](docs/code-parser.md) | `src/modules/code-parser/` |
| TextGenerator | [docs/text-generator.md](docs/text-generator.md) | `src/modules/text-generator/` |
| AiEnhancer | [docs/ai-enhancer.md](docs/ai-enhancer.md) | `src/modules/ai-enhancer/` |
| Security | [docs/security.md](docs/security.md) | `src/modules/security/` |
| CLI | — | `src/modules/cli/` |
| AnalyzerService | [docs/analyzer.md](docs/analyzer.md) | `src/core/analyzer/` |

---

## Project Structure

```
src/
├── config/env.js                  # Environment configuration
├── core/analyzer/
│   ├── analyzer.service.js        # Orchestrates the full pipeline
│   └── analyzer.routes.js         # Route definitions
├── modules/
│   ├── cli/                       # Interactive CLI (@clack/prompts)
│   ├── cloner/                    # RepositoryCloner
│   ├── structure-extractor/       # StructureExtractor
│   ├── code-parser/               # CodeParser + AST extractors
│   ├── text-generator/            # TextGenerator + formatters
│   ├── ai-enhancer/               # AiEnhancer + Ollama integration
│   ├── security/                  # Path & size validation
│   └── file-analyzer/             # Placeholder
├── routes/
│   └── analyzer.routes.js         # Express routes
└── utils/
    └── file.utils.js              # Placeholder
server.js                           # Entry point (legacy API)
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| @babel/parser | AST parsing for JS/TS |
| simple-git | Git operations |
| Ollama | Local LLM inference |
| @clack/prompts | Interactive CLI prompts |

---

## Architecture Principles

- **Modular**: Each feature is a self-contained module in `src/modules/`
- **Pipeline-oriented**: Modules connect sequentially, each transforming the output of the previous
- **Pure formatters**: Text generation uses stateless functions with no side effects
- **Fail-soft**: AST extractors catch errors per file without crashing the whole analysis
- **Environment-configured**: Model selection and server URLs come from `.env`

---

## Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.
