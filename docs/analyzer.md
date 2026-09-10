# AnalyzerService

`src/core/analyzer/analyzer.service.js` orchestrates normalization, acquisition,
validation, extraction, parsing, rendering, optional AI and cleanup.

```js
const result = await new AnalyzerService().analyze(input, "md", "es", {
  ai: false,
  outputDir: "./reports",
});
```

- `input`: local directory, `.zip`/`.ZIP`, HTTP(S), SSH or Git URL.
- `format`: `txt` (default) or `md`.
- `language`: `en` (default) or `es`.
- `options.ai`: set to `false` to bypass Ollama even when a model is configured.
- `options.outputDir`: parent directory for a unique Markdown report.

Returns `summary`, `repoPath`, `diagnostics`, `skippedFiles`, `parserFailures` and
`aiUsed`. Markdown also returns `outputDir` and `outputPaths`.
For ZIPs `repoPath` is null: the extracted source is removed after analysis.
Generated documents remain available outside the temporary workspace.

Markdown never writes into the source README or existing docs. Every run creates
a fresh `report-*` directory; its `README.md` links to module files with bounded,
stable SHA-256 identifiers derived from relative directory paths. Root files are
included as the `root` module. Cloned project identity is passed separately from
the unique temporary directory name.

Per-file parser failures are collected and valid files remain usable. Python
errors are explicit; SQL AST fallbacks carry warnings. AI failures return the
deterministic report with diagnostics. A Markdown AI failure stops further AI
attempts in the same report; a two-minute overall budget also limits enrichment.

Remote clones are retained after success and removed on failure. ZIP workspaces
are always removed, including when validation fails. Local sources are retained.

See `test/report-output.test.js`, `test/analysis-reliability.test.js` and
`test/repository-lifecycle.test.js` for service-level regression tests.
