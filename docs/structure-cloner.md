# RepositoryCloner

`src/modules/cloner/index.js` accepts HTTP(S), Git and SSH remotes, or local Git
paths when called directly. `AnalyzerService` analyzes local directories in place.

## Constructor

`new RepositoryCloner({ baseTempDir, gitOptions, cloneTimeoutMs })`

- Default base: `path.join(os.tmpdir(), "explainhub")`.
- Each clone/extraction gets a unique `mkdtemp` directory.
- Default Git timeout: 60,000 ms, enforced by terminating the spawned Git process.
- `gitOptions` supplies simple-git options; the timeout policy is configured separately.

## Methods

`clone(url, processCallback?)` shallow-clones the repository and returns
`{ repositoryUrl, tempPath, repoPath, cloneName }`. Failure cleans its workspace.
With a callback the workspace is also cleaned after the callback settles; without
one, the successful clone remains available to the caller.

`extractZip(zipPath)` returns the same metadata shape. `extractArchive.js` uses
`yauzl` lazy entries and backpressure-aware streams, checks declared and actual
sizes, rejects unsafe paths/symlinks and refuses duplicate destinations. A single
top-level directory is unwrapped. The service removes the extraction after use.

`safeZipEntryName(name, repoPath)` rejects absolute paths and paths escaping the
destination, including Windows-style separators. `cleanup(path)` only permits a
direct child of the configured temporary base. Cleanup never deletes an existing
workspace merely because its repository name matches a new input.

See [security policy](security.md) for limits and [AnalyzerService](analyzer.md)
for retention and output behavior. Automated tests include real traversal entries,
dishonest size headers, concurrent extraction and a stalled local Git connection.
