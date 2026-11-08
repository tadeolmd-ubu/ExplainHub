# Module: test

Automated and manual tests covering parsing, cloning, security, and documentation flows.


## File Structure

| File | Purpose |
| ------ | ------ |
| `ai-enhancer.test.js` | Automated tests for the AI enhancer, prompt building, and Markdown cleanup |
| `cloner.test.js` | Automated tests for repository cloning, ZIP extraction, and cleanup |
| `dart-parser.test.js` | Automated tests for Dart parsing and extracted metadata |
| `kt-parser.test.js` | Automated tests for Kotlin parsing and extracted metadata |
| `manual-cloner-test.manual.js` | Manual script for exercising the cloner against real repositories |
| `md-flow.test.js` | Automated tests for the Markdown generation and enhancement flow |
| `security.test.js` | Automated tests for path validation and repository size limits |
| `sh-parser.test.js` | Automated tests for shell parsing and route extraction |
| `test-ai-enhancer.manual.js` | Manual script for exercising the AI enhancer on sample Markdown |
| `test-code-parser.manual.js` | Manual script for exercising language parsers on sample files |
| `test-text-generator.manual.js` | Manual script for exercising README and module text generation |
| `zip-flow.test.js` | Automated tests for ZIP upload, extraction, and analysis |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| run | function | yes | `test-ai-enhancer.manual.js` | Executes the script and reports its results. |
| run | function | yes | `test-code-parser.manual.js` | Executes the script and reports its results. |
| run | function | yes | `test-text-generator.manual.js` | Executes the script and reports its results. |
