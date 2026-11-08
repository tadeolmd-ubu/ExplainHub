# Module: md

Markdown formatters for project READMEs and per-module documentation pages in the generated output.


## File Structure

| File | Purpose |
| ------ | ------ |
| `modules.js` | Markdown section builders for per-module documentation pages |
| `readme.js` | Markdown section builders for the project README |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| moduleFormatter | function |  | `modules.js` | Formats a complete per-module documentation page. |
| fileStructureSection | function |  | `modules.js` | Renders the File Structure section. |
| getFileTypeDesc | function |  | `modules.js` | Returns a short description for a file type. |
| functionsSection | function |  | `modules.js` | Renders the Functions table. |
| classesSection | function |  | `modules.js` | Renders the Classes table. |
| exportsSection | function |  | `modules.js` | Renders the Exports table. |
| routesSection | function |  | `modules.js` | Renders the Routes table. |
| sqlSection | function |  | `modules.js` | Renders SQL schema and object sections. |
| readmeFormatter | function |  | `readme.js` | Formats the complete project README. |
| getProjectName | function |  | `readme.js` | Returns the project name from the manifest or directory. |
| overviewSection | function |  | `readme.js` | Renders the Overview section. |
| projectInfoSection | function |  | `readme.js` | Renders the Project Info section. |
| dependenciesSection | function |  | `readme.js` | Renders the Dependencies table. |
| featuresSection | function |  | `readme.js` | Renders the Features section. |
| structureSection | function |  | `readme.js` | Renders the Project Structure section. |
| renderTree | function |  | `readme.js` | Renders the project tree as a fenced code block. |
| isIgnored | function |  | `readme.js` | Checks whether a path is excluded from the tree. |
| modulesSection | function |  | `readme.js` | Renders the README Modules table. |
| moduleDescription | function |  | `readme.js` | Returns a short description for a module. |
| schemaSection | function |  | `readme.js` | Renders the SQL schema section. |
| getStartedSection | function |  | `readme.js` | Renders the Get Started section. |

## Exports

| Name | Kind | File |
|------|------|------|
| moduleFormatter | function | `modules.js` |
| readmeFormatter | function | `readme.js` |
