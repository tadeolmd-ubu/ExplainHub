# ExplainHub

![Tests](https://github.com/tadeolmd-ubu/ExplainHub/actions/workflows/test.yml/badge.svg)

explainHub analyzes any Git repository — clones it, parses its source code via AST, and generates a structured plain-text summary. Optionally enhances the summary with a local LLM (Ollama) to produce a polished narrative report in Spanish or Markdown.

---

## Pipeline

```
Repository (local, remote, or .zip)
    │
    ▼
RepositoryCloner      →  Clones repo / streams .zip into a unique OS temp directory
    │                     (remote repos kept on disk after analysis)
    ▼
StructureExtractor    →  Builds file tree, detects technologies & entry points
    │
    ▼
CodeParser            →  Parses JS/TS/HTML/CSS/SQL/Python/PHP/C#/Rust/Java/Go/C/C++/Ruby/Shell/PowerShell/Kotlin/Dart/INI/.NET/Cargo
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
Output                →  Console + optional new .txt / independent README.md + docs/*
                        (remote repos: path printed for navigation)
```

---

## Features

| Step | Module | What it does |
|------|--------|-------------|
| 1 | RepositoryCloner | Uses unique OS temporary directories; successful remote clones retained, ZIP workspaces cleaned up |
| 2 | StructureExtractor | Builds recursive file tree, detects tech stack |
| 3 | CodeParser | Parses JS/TS/HTML/CSS/SQL/Python/PHP/C#/Rust/Java/Go/C/C++/Ruby/Shell/PowerShell/Kotlin/Dart/INI/.NET/Cargo via `@babel/parser`, SQL AST, `web-tree-sitter`, `php-parser`, `tree-sitter-kotlin`, `smol-toml`, and shell-to-`ast` |
| 4 | TextGenerator | Produces structured plain text report or Markdown docs (README.md + `docs/*.md`) with Project Info, Dependencies, Features sections |
| 5 | AiEnhancer | Produces a TXT narrative or adds a labeled Markdown description while preserving extracted facts |
| — | Security | Validates paths and repository size before processing |
| — | CLI | Interactive menu or flags for input, format, language, output and disabling AI |

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

For scripts and CI:

```bash
explain ./my-project --format md --language es --output ./reports --no-ai
explain ./my-project --format txt --output ./summary.txt --no-ai
explain --help
```

Markdown is written to a new `report-*` directory under `--output`, or under
`./explainhub-output` by default. The source README and docs are preserved.
TXT output refuses to overwrite an existing file. ZIP reports survive workspace
cleanup; no deleted repository path is advertised. Noninteractive errors exit with code 1.

Spanish/English selection localizes report labels without translating source
identifiers or manifest text. AI narrative uses the selected language.

### Local HTTP API

`npm start` listens on `127.0.0.1:3000` by default. `POST /api/analyze` accepts:

```json
{ "projectPath": "./my-project", "language": "es", "ai": false }
```

The API accepts local paths/ZIPs within `ANALYSIS_ROOT` (default: current working
directory), resolved through symlinks. Use the CLI for remote repositories.
At most two analyses run concurrently; excess requests receive HTTP 429.
If `API_TOKEN` is configured, send `Authorization: Bearer <token>`.
Set `HOST` explicitly to expose the server; use authentication and HTTPS for a
shared deployment. Responses include diagnostics, skipped files and AI usage.

### 2. Run tests

```bash
npm test
npm audit --audit-level=moderate
```

Runs `test/*.test.js` using Node's built-in test runner (`node:test`). Automated AI
tests use simulated clients; they require neither a model nor a running Ollama.
Files ending in `.manual.js` are exploratory scripts and are not part of this command.

**Test files:**
| File | Coverage |
|------|----------|
| `test/security.test.js` | Security: `validatePath` and `validateRepositorySize` |
| `test/cloner.test.js` | Cloner: URL validation, repository name extraction, source detection |
| `test/ai-enhancer.test.js` | AiEnhancer: `postProcess` formatting, fallbacks, deduplication |
| `test/kt-parser.test.js` | Kotlin parser: imports, classes, functions, exports |
| `test/dart-parser.test.js` | Dart parser: imports, classes, mixins, enums, extensions, functions, exports |
| `test/sh-parser.test.js` | Bash parser: imports, functions, exports, curl/wget routes |
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
| `.ps1`, `.psm1` | PowerShell | `web-tree-sitter` (WASM) |
| `.sh`, `.bash` | Shell (Bash) | `web-tree-sitter` (WASM) |
| `.kt`, `.kts` | Kotlin | `web-tree-sitter` + bundled Kotlin WASM |
| `.dart` | Dart | `web-tree-sitter` (WASM) |
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

_Kotlin, Dart, and Bash were the most recent additions — no further languages are planned at this time._

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 22+ | Runtime |
| @babel/parser | AST parsing for JS/TS |
| node-sql-parser | SQL AST parsing with dialect support |
| php-parser | PHP AST parsing (pure JS, zero deps) |
| web-tree-sitter | WASM-based AST parsing for C#, Rust, Java, Go, C/C++, Ruby, PowerShell, INI, Dart, Shell/Bash, and Kotlin |
| @vscode/tree-sitter-wasm | Prebuilt WASM grammars (C#, Rust, Java, Go, C/C++, Ruby, PowerShell, INI, Bash, Dart, etc.) |
| fast-xml-parser | XML parsing for .csproj, .config, .xaml |
| smol-toml | TOML parsing for Cargo.toml, Cargo.lock, rust-toolchain.toml, .cargo/config.toml |
| python3 (ast module) | Python AST parsing via shell subprocess |
| simple-git | Git operations |
| yauzl | Streaming ZIP extraction with actual decompressed-byte limits |
| yazl (dev) | ZIP fixtures for automated tests |
| Ollama | Local LLM inference |
| @clack/prompts | Interactive CLI prompts |

---

## Architecture Principles

- **Modular**: Each feature is a self-contained module in `src/modules/`
- **Pipeline-oriented**: Modules connect sequentially, each transforming the output of the previous
- **Separated output**: Renderers consume extracted metadata; writing uses a dedicated output module
- **Fail-soft with diagnostics**: Parser errors are returned separately from valid files; SQL text fallbacks produce warnings
- **Environment-configured**: Model selection and server URLs come from `.env`

---

## CI / CD

Tests run automatically via GitHub Actions on every push and on pull requests to
`main`. See [`.github/workflows/test.yml`](.github/workflows/test.yml).

## Resource limits and scope

Default budgets: 5,000 files, 100 MiB total, 10 MiB per file, depth 64 and
10,000 traversed entries. Symlinks and non-regular files are skipped. ZIPs are
streamed into fresh workspaces; traversal paths, symlinks, oversized files and
dishonest size headers are rejected. Git processes have a 60-second timeout;
checkout limits do not impose a network-transfer quota.

Ollama requests default to 60 seconds (`OLLAMA_TIMEOUT_MS`). Markdown enhancement
has a two-minute budget and stops attempting subsequent modules after a failure.
Input/output budgets prevent unbounded AI payloads. Python runs in batches of at
most eight files with a 30-second subprocess timeout.

JavaScript route detection covers common statically declared Express apps and
routers, including static imported mounts. Dynamic routing, runtime aliases and
arbitrary frameworks require further analysis. The output is a static report,
not proof of runtime behavior or correctness of an AI interpretation.

See [the remediation plan](docs/plan-correccion-errores.md) and
[implementation report](docs/informe-correcciones.md) for changes and verification.

## Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.
