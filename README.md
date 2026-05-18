# ExplainHub

explainHub is a software solution that helps you understand any codebase. It analyzes a Git repository's structure, parses source files via AST, and generates a plain text summary. This summary can be enhanced by a local LLM (Ollama) to produce a polished narrative report.

---

## Pipeline Overview

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
CodeParser            →  Parses JS/TS files with @babel/parser AST
                        Extracts imports, exports, functions, classes, routes
    │
    ▼
TextGenerator         →  Transforms analysis data into plain text sections
    │
    ▼
AiEnhancer            →  Sends plain text to local LLM (Ollama)
                        Returns a streaming narrative report in Spanish
```

---

##  Features

| Step | Module | What it does |
|------|--------|-------------|
| 1 | RepositoryCloner | Clones remote or local repos into `/temp` |
| 2 | StructureExtractor | Builds recursive file tree, detects tech stack |
| 3 | CodeParser | Parses JS/TS via `@babel/parser` AST |
| 4 | TextGenerator | Produces structured plain text report |
| 5 | AiEnhancer | Sends report to Ollama for AI-powered summary |

---

##  Installation

```bash
git clone https://github.com/tadeolmd-ubu/ExplainHub.git
cd ExplainHub
npm install
```

### Install Ollama (optional, for AI enhancement)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (e.g., qwen3.5)
ollama pull qwen3.5

# Start Ollama server
ollama serve
```

### Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=3000
OLLAMA_MODEL=qwen3.5
OLLAMA_URL=http://localhost:11434
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

##  Quick Start

### 1. Analyze a local project

```bash
node test/test-text-generator.js /path/to/your/project
```

This runs the full pipeline (StructureExtractor → CodeParser → TextGenerator) and outputs a structured plain text report.

### 2. Generate AI-enhanced summary

```bash
node test/test-ai-enhancer.js /path/to/your/project
```

Requires Ollama running with a model configured in `.env`.

### 3. Run the server

```bash
npm run dev
```

Test: `GET http://localhost:3000/health`

---

##  Module Documentation

| Module | Docs | Source |
|--------|------|--------|
| RepositoryCloner | [docs/structure-cloner.md](docs/structure-cloner.md) | `src/modules/cloner/` |
| StructureExtractor | [docs/structure-extractor.md](docs/structure-extractor.md) | `src/modules/structure-extractor/` |
| CodeParser | [docs/code-parser.md](docs/code-parser.md) | `src/modules/code-parser/` |
| TextGenerator | [docs/text-generator.md](docs/text-generator.md) | `src/modules/text-generator/` |
| AiEnhancer | [docs/ai-enhancer.md](docs/ai-enhancer.md) | `src/modules/ai-enhancer/` |

---

##  Project Structure

```
src/
├── api/controller.js              # API handler (placeholder)
├── app.js                         # Express app setup
├── config/env.js                  # Env config loader (placeholder)
├── core/analyzer/                 # Orchestration layer (placeholder)
├── middleware/                     # Express middleware (placeholder)
├── modules/
│   ├── cloner/                    # RepositoryCloner
│   ├── structure-extractor/       # StructureExtractor
│   ├── code-parser/               # CodeParser + AST extractors
│   ├── text-generator/            # TextGenerator + formatters
│   ├── file-analyzer/             # Placeholder
│   └── ai-enhancer/               # AiEnhancer + Ollama integration
├── routes/                        # Express routes (placeholder)
└── utils/                         # Shared utilities (placeholder)
server.js                          # Entry point
```

---

##  Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| Express | HTTP server |
| @babel/parser | AST parsing for JS/TS |
| simple-git | Git operations |
| Ollama | Local LLM inference |
| bullmq + ioredis | Job queue (future) |

---

##  Architecture Principles

- **Modular**: Each feature is a self-contained module in `src/modules/`
- **Pipeline-oriented**: Modules connect sequentially, each transforming the output of the previous
- **Pure formatters**: Text generation uses stateless functions with no side effects
- **Fail-soft**: AST extractors catch errors per file without crashing the whole analysis
- **Environment-configured**: Model selection and server URLs come from `.env`

---

##  Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.
