# Security and resource policy

## Input and traversal

`source.js` normalizes input once, expands home-relative paths and recognizes
supported remote schemes and case-insensitive ZIP extensions. `validatePath`
performs lexical checks; the service additionally calls `validateRealPath` to
check the actual local target against sensitive system roots.

Both the size validator and structure extractor use `lstat`, skip symlinks and
non-regular files, and stop when traversal budgets are exceeded. Source reads use
`O_NOFOLLOW` where available and recheck file size. Package metadata is bounded
and symlinks are not followed. These checks do not constitute an OS sandbox
against another process concurrently mutating ancestor directories.

| Limit | Default |
|---|---|
| Files | 5,000 |
| Total source bytes | 100 MiB |
| Individual source file | 10 MiB |
| Directory depth | 64 |
| Traversed entries | 10,000 |
| Compressed ZIP size | 100 MiB |
| ZIP entries | 5,000 |

`limits.js` is the shared source of defaults. `validateRepositorySize` returns a
`safe` flag, a rejection reason, and observed counters. Missing paths throw.
The service converts size failures into HTTP 413.

## ZIP and Git lifecycle

Each operation receives a unique workspace under the OS temporary directory.
ZIP extraction uses `yauzl` lazy entries and Node stream pipelines, checking
actual decompressed bytes as well as declared sizes. Traversal entries, absolute
paths, symbolic links and duplicate destinations are rejected. The extractor
unwraps a single top-level directory. It cleans the workspace on failure.

Git has a real 60-second process timeout using simple-git with output-based timer
refresh disabled. This does not enforce a maximum number of network bytes.
Successful remote clones remain on disk for navigation; users should delete
them when no longer needed. Cleanup accepts only direct children of its base.

## API

Default binding is `127.0.0.1`. Only local inputs under the canonical
`ANALYSIS_ROOT` are accepted. Remote repositories remain a CLI feature.
There are at most two simultaneous API analyses. Invalid inputs receive 400,
out-of-root paths 403, size failures 413, and capacity exhaustion 429.
An optional `API_TOKEN` requires a Bearer token using constant-time comparison.
Internal error details are logged server-side, not returned with HTTP 500.

Tests cover symlink cycles, outside targets, concurrent workspaces, a stalled Git
connection, malicious ZIP traversal and false size headers. They do not claim
cross-platform sandboxing or a deployment-level network policy.
