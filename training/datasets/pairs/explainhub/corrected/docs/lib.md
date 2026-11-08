# Module: lib

Shared Markdown-contract and metric helpers used by the training scripts.


## File Structure

| File | Purpose |
| ------ | ------ |
| `markdown-contract.mjs` | Checks corrected Markdown against the production prompt contract |
| `metrics.mjs` | Computes structural and textual evaluation metrics for model output |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| normalizeHeading | function |  | `markdown-contract.mjs` | Normalizes a heading for comparison. |
| splitSections | function |  | `markdown-contract.mjs` | Splits Markdown into level 1-3 heading sections. |
| headingSequence | function |  | `markdown-contract.mjs` | Returns the ordered heading sequence of a document. |
| findSection | function |  | `markdown-contract.mjs` | Finds a section by its normalized heading. |
| firstTable | function |  | `markdown-contract.mjs` | Returns the first Markdown table in a section body. |
| isTableLine | arrow |  | `markdown-contract.mjs` | Checks whether a line belongs to a Markdown table. |
| isSeparator | arrow |  | `markdown-contract.mjs` | Checks whether a table row is the separator row. |
| tableForSection | function |  | `markdown-contract.mjs` | Returns the first table inside a named section. |
| tableColumn | function |  | `markdown-contract.mjs` | Returns the index of a named table column. |
| fileNamesFromTable | function |  | `markdown-contract.mjs` | Collects the file names listed in a table. |
| documentDescription | function |  | `markdown-contract.mjs` | Extracts the prose between the title and first section. |
| hasDescription | function |  | `markdown-contract.mjs` | Checks whether the document has a prose description. |
| isSubset | function |  | `markdown-contract.mjs` | Checks whether every value in the first set exists in the second. |
| sameList | function |  | `markdown-contract.mjs` | Checks whether two lists are identical. |
| describeList | function |  | `markdown-contract.mjs` | Formats a list for an error message. |
| checkCorrection | function |  | `markdown-contract.mjs` | Validates a corrected document against the Markdown contract. |
| words | function |  | `metrics.mjs` | Splits text into lowercase words. |
| wordSet | function |  | `metrics.mjs` | Builds a set of unique words. |
| jaccard | function |  | `metrics.mjs` | Computes Jaccard similarity between two sets. |
| headingSet | function |  | `metrics.mjs` | Implements the heading Set helper used by this module. |
| sectionRecall | function |  | `metrics.mjs` | Implements the section Recall helper used by this module. |
| tableRows | function |  | `metrics.mjs` | Implements the table Rows helper used by this module. |
| rowsMatch | function |  | `metrics.mjs` | Implements the rows Match helper used by this module. |
| scoreRow | function |  | `metrics.mjs` | Scores one model output against the reference correction. |
| averageMetrics | function |  | `metrics.mjs` | Averages metric values across evaluation rows. |
| formatPercent | function |  | `metrics.mjs` | Formats a ratio as a percentage. |
| formatNumber | function |  | `metrics.mjs` | Formats a number with fixed decimals. |

## Exports

| Name | Kind | File |
|------|------|------|
| normalizeHeading | function | `markdown-contract.mjs` |
| splitSections | function | `markdown-contract.mjs` |
| headingSequence | function | `markdown-contract.mjs` |
| findSection | function | `markdown-contract.mjs` |
| firstTable | function | `markdown-contract.mjs` |
| tableForSection | function | `markdown-contract.mjs` |
| tableColumn | function | `markdown-contract.mjs` |
| fileNamesFromTable | function | `markdown-contract.mjs` |
| documentDescription | function | `markdown-contract.mjs` |
| hasDescription | function | `markdown-contract.mjs` |
| checkCorrection | function | `markdown-contract.mjs` |
| TABLE_SECTION_KEYS | named | `markdown-contract.mjs` |
| scoreRow | function | `metrics.mjs` |
| averageMetrics | function | `metrics.mjs` |
| formatPercent | function | `metrics.mjs` |
| formatNumber | function | `metrics.mjs` |
