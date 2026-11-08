# Module: scripts

Dataset, evaluation, and example-generation scripts for the ExplainHub fine-tuning workflow.


## File Structure

| File | Purpose |
| ------ | ------ |
| `build-dataset.mjs` | Builds the ChatML training dataset from raw and corrected docs |
| `evaluate.mjs` | Compares base and fine-tuned models on held-out repositories |
| `make-example.mjs` | Regenerates the committed example ChatML rows |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| usage | function |  | `build-dataset.mjs` | Prints the command usage and available options. |
| parseArgs | function |  | `build-dataset.mjs` | Parses command-line flags into an options object. |
| next | arrow |  | `build-dataset.mjs` | Returns the next command-line argument value. |
| readJson | function | yes | `build-dataset.mjs` | Reads and parses a JSON file from disk. |
| fileExists | function | yes | `build-dataset.mjs` | Checks whether a path exists on disk. |
| listFiles | function | yes | `build-dataset.mjs` | Recursively lists files beneath a directory. |
| gitCommit | function |  | `build-dataset.mjs` | Returns the current Git commit for a repository. |
| generateRawDocs | function | yes | `build-dataset.mjs` | Generates raw Markdown documents from a repository. |
| writeDocs | function | yes | `build-dataset.mjs` | Writes generated documents into a snapshot directory. |
| snapshotRepo | function | yes | `build-dataset.mjs` | Snapshots the raw documentation for one repository. |
| docKind | function |  | `build-dataset.mjs` | Classifies a document as a README or module page. |
| rowId | function |  | `build-dataset.mjs` | Builds the stable identifier for one dataset row. |
| buildRows | function | yes | `build-dataset.mjs` | Builds ChatML rows from raw and corrected document pairs. |
| writeJsonl | function |  | `build-dataset.mjs` | Writes ChatML rows as newline-delimited JSON. |
| main | function | yes | `build-dataset.mjs` | Runs the command entry point and coordinates the workflow. |
| usage | function |  | `evaluate.mjs` | Prints the command usage and available options. |
| parseArgs | function |  | `evaluate.mjs` | Parses command-line flags into an options object. |
| next | arrow |  | `evaluate.mjs` | Returns the next command-line argument value. |
| readJsonl | function | yes | `evaluate.mjs` | Reads newline-delimited JSON records from disk. |
| generate | function | yes | `evaluate.mjs` | Generates the complete documentation output from the parsed project. |
| extractPrompt | function |  | `evaluate.mjs` | Extracts the raw document from the production prompt. |
| markdownTable | function |  | `evaluate.mjs` | Renders the comparison table as Markdown. |
| format | arrow |  | `evaluate.mjs` | Formats a metric value for the report. |
| evaluateModel | function | yes | `evaluate.mjs` | Runs one model over the evaluation rows and scores the output. |
| summarize | function |  | `evaluate.mjs` | Aggregates per-row metrics into a summary. |
| main | function | yes | `evaluate.mjs` | Runs the command entry point and coordinates the workflow. |
