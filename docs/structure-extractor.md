# StructureExtractor

`extract(projectPath)` returns `{ tree, technologies, entryPoints }`.

The tree uses `{ name, type: "directory", children }` and `{ name, type: "file" }`.
`buildTree` delegates to `processNode`, which uses `lstat` and streaming directory
iteration. Symbolic links and non-regular files are omitted. A shared traversal
budget limits depth, file size, total size, entry count and file count. Children
are sorted by name for reproducible output.

`ignoredNames` is also used by repository size validation: node_modules, .git,
dist, build, coverage, .env, generated and explainhub-output.

`detectTechnologies` uses `techRules.js` exact filenames and extension rules.
`findEntryPoints` uses `entryRules.js` and retains relative paths, so two index.js
files in different directories are not reduced to the same filename.

The service canonicalizes the input root before invoking the extractor.
The extractor performs its own resource checks rather than relying only on an
earlier size-validation pass. These are static filesystem heuristics, not runtime
discovery of entry points or a guarantee against concurrent filesystem mutation.
