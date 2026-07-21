# ExplainHub

![Tests](https://github.com/tadeolmd-ubu/ExplainHub/actions/workflows/test.yml/badge.svg)

explainHub analyzes any Git repository — clones it, parses its source code via AST, and generates a structured plain-text summary. Optionally enhances the summary with a local LLM (Ollama) to produce a polished narrative report in Spanish or Markdown.

---

## Pipeline

```
Repository (local, remote, or .zip)
    │
    ▼
RepositoryCloner      →  Clones repo / extracts .zip to temp directory
    │                     (remote repos kept on disk after analysis)
    ▼
StructureExtractor    →  Builds file tree, detects technologies & entry points
    │
    ▼
CodeParser            →  Parses JS/TS/HTML/CSS/SQL/Python/PHP/C#/Rust/Java/Go/C/C++/Ruby/.NET/Cargo
                         Extracts imports, exports, functions, classes, routes
    │
    ▼
TextGenerator         →  Transforms analysis data into plain text or Markdown
                         (md includes: Project Info, Dependencies, Features, Modules)
    │
    ▼
AiEnhancer            →  Sends report to local LLM (Ollama)
                        Returns enhanced narrative in txt or md
    │
    ▼
Output                →  Console + optional save to .txt / README.md + docs/*
                        (remote repos: path printed for navigation)
```

---

## Features

| Step | Module | What it does |
|------|--------|-------------|
| 1 | RepositoryCloner | Clones remote repos into `/temp` (kept on disk); extracts `.zip` files (cleaned up) |
| 2 | StructureExtractor | Builds recursive file tree, detects tech stack |
| 3 | CodeParser | Parses JS/TS/HTML/CSS/SQL/Python/PHP/C#/Rust/Java/Go/C/C++/Ruby/.NET/Cargo via `@babel/parser`, SQL AST, `web-tree-sitter`, `php-parser`, `smol-toml`, and shell-to-`ast` |
| 4 | TextGenerator | Produces structured plain text report or Markdown docs (README.md + `docs/*.md`) with Project Info, Dependencies, Features sections |
| 5 | AiEnhancer | Sends report to Ollama for AI-powered summary in txt or md |
| — | Security | Validates paths and repository size before processing |
| — | CLI | Interactive menu: URL, local path, .zip, format selection (txt/md), save to file. Prints cloned repo path after analysis |

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
node --test
```

Runs all tests in `test/` using Node's built-in test runner (`node:test`). Tests that require Ollama will be skipped automatically if `OLLAMA_MODEL` is not set.

**Test files:**
| File | Coverage |
|------|----------|
| `test/.test.js` | Cloner, StructureExtractor, CodeParser, TextGenerator, AiEnhancer, AnalyzerService |
| `test/md-flow.test.js` | Markdown flow: README sections, modules structure, no-package.json fallback |
| `test/zip-flow.test.js` | ZIP extraction: valid zip, invalid zip error |

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
│   └── analyzer.service.js        # Orchestrates the full pipeline
├── modules/
│   ├── cli/                       # Interactive CLI (@clack/prompts)
│   ├── cloner/                    # RepositoryCloner
│   ├── structure-extractor/       # StructureExtractor
│   ├── code-parser/               # CodeParser + AST extractors + Cargo parsers
│   ├── text-generator/            # TextGenerator + formatters (txt + md)
│   ├── ai-enhancer/               # AiEnhancer + Ollama integration
│   └── security/                  # Path & size validation
├── routes/
│   └── analyzer.routes.js         # Express routes
server.js                           # Entry point (legacy API)
```

---

## Supported Languages

The `CodeParser` can analyze the following file types:

| Extension | Language | Parser Engine |
|-----------|----------|---------------|
| `.js`, `.mjs`, `.cjs`, `.jsx` | JavaScript | `@babel/parser` |
| `.ts`, `.tsx` | TypeScript | `@babel/parser` |
| `.html` | HTML | regex |
| `.css` | CSS | regex |
| `.sql` | SQL | `node-sql-parser` + regex fallback |
| `.py`, `.pyw` | Python | `python3 -c "import ast"` (batch) |
| `.php` | PHP | `php-parser` |
| `.cs` | C# | `web-tree-sitter` (WASM) |
| `.rs` | Rust | `web-tree-sitter` (WASM) |
| `.java` | Java | `web-tree-sitter` (WASM) |
| `.go` | Go | `web-tree-sitter` (WASM) |
| `.c`, `.h` | C | `web-tree-sitter` (WASM) |
| `.cpp`, `.cc`, `.cxx` | C++ | `web-tree-sitter` (WASM) |
| `.rb`, `.rake`, `.gemspec` | Ruby | `web-tree-sitter` (WASM) |
| `.ini`, `.cfg` | INI | `web-tree-sitter` (WASM) |
| `.sln` | Solution | regex |
| `.csproj` | C# Project | `fast-xml-parser` |
| `.config` | Configuration | `fast-xml-parser` |
| `.xaml` | XAML | `fast-xml-parser` |
| `Cargo.toml` | Cargo Manifest | `smol-toml` |
| `Cargo.lock` | Cargo Lock | `smol-toml` |
| `rust-toolchain.toml` | Rust Toolchain | `smol-toml` |
| `.cargo/config.toml` | Cargo Config | `smol-toml` |

### README Markdown Sections

When generating Markdown (`format: "md"`), the README includes additional sections extracted from project config files:

| Section | Source | Content |
|---------|--------|---------|
| Project Info | `Cargo.toml` or `package.json` | Version, edition, description, license, authors |
| Dependencies | `Cargo.toml` or `package.json` | Dependency name, version, type (normal/dev/build) |
| Features | `Cargo.toml` | Feature names and implications (only if defined) |

### Planned Languages

Languages we plan to add in future releases:

| Language | Extension | Engine |
|----------|-----------|--------|
| PowerShell | `.ps1`, `.psm1` | `web-tree-sitter` (WASM) — grammar already bundled |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| @babel/parser | AST parsing for JS/TS |
| node-sql-parser | SQL AST parsing with dialect support |
| php-parser | PHP AST parsing (pure JS, zero deps) |
| web-tree-sitter | WASM-based AST parsing for C#, Rust, Java, Go, C/C++, Ruby, and INI |
| @vscode/tree-sitter-wasm | Prebuilt WASM grammars (C#, Rust, Java, Go, C/C++, Ruby, INI, etc.) |
| fast-xml-parser | XML parsing for .csproj, .config, .xaml |
| smol-toml | TOML parsing for Cargo.toml, Cargo.lock, rust-toolchain.toml, .cargo/config.toml |
| python3 (ast module) | Python AST parsing via shell subprocess |
| simple-git | Git operations |
| adm-zip | ZIP file extraction |
| Ollama | Local LLM inference |
| @clack/prompts | Interactive CLI prompts |

---

## Architecture Principles

- **Modular**: Each feature is a self-contained module in `src/modules/`
- **Pipeline-oriented**: Modules connect sequentially, each transforming the output of the previous
- **Pure formatters**: Text generation uses stateless functions with no side effects
- **Fail-soft**: AST extractors catch errors per file without crashing the whole analysis; Python syntax errors return empty structures
- **Environment-configured**: Model selection and server URLs come from `.env`

---

## CI / CD

Tests run automatically via GitHub Actions on every push and pull request to `main` and `dev`. See [`.github/workflows/test.yml`](.github/workflows/test.yml) for details.

## Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.
