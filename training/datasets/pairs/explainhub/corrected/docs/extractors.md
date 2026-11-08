# Module: extractors

AST extractors that collect functions, classes, exports, routes, SQL objects, and comments.


## File Structure

| File | Purpose |
| ------ | ------ |
| `alterExtractor.js` | Extractor that collects ALTER statements from parsed AST nodes |
| `cjsExportExtractor.js` | Extractor that collects CommonJS exports from parsed AST nodes |
| `classExtractor.js` | Extractor that collects class from parsed AST nodes |
| `commentExtractor.js` | Extracts source comments from parsed AST nodes |
| `createOtherExtractor.js` | Extractor that collects CREATE VIEW, INDEX, FUNCTION, PROCEDURE, and TRIGGER statements from parsed AST nodes |
| `createTableExtractor.js` | Extractor that collects CREATE TABLE statements from parsed AST nodes |
| `declarationExportExtractor.js` | Extractor that collects declaration Export from parsed AST nodes |
| `dmlExtractor.js` | Extractor that collects DML statements from parsed AST nodes |
| `dropExtractor.js` | Extractor that collects DROP statements from parsed AST nodes |
| `exportsExtractor.js` | Extractor that collects export declarations from parsed AST nodes |
| `functionExtractor.js` | Extractor that collects function from parsed AST nodes |
| `importExtractor.js` | Extractor that collects import from parsed AST nodes |
| `routesExtractor.js` | Extracts HTTP route definitions from parsed AST nodes |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| extractAlter | function |  | `alterExtractor.js` | Extracts ALTER statements from parsed nodes. |
| extractCjsExport | function |  | `cjsExportExtractor.js` | Extracts CommonJS exports from parsed nodes. |
| extractClasses | function |  | `classExtractor.js` | Extracts class declarations from parsed nodes. |
| visit | arrow |  | `classExtractor.js` | Visits matching AST nodes and records the extracted data. |
| extractComments | function |  | `commentExtractor.js` | Extracts comment sections from parsed nodes. |
| extractOtherCreate | function |  | `createOtherExtractor.js` | Extracts CREATE VIEW, INDEX, FUNCTION, PROCEDURE, and TRIGGER statements from parsed nodes. |
| extractCreateView | function |  | `createOtherExtractor.js` | Extracts CREATE VIEW statements from parsed nodes. |
| extractCreateIndex | function |  | `createOtherExtractor.js` | Extracts CREATE INDEX statements from parsed nodes. |
| extractCreateFunction | function |  | `createOtherExtractor.js` | Extracts CREATE FUNCTION statements from parsed nodes. |
| extractCreateProcedure | function |  | `createOtherExtractor.js` | Extracts CREATE PROCEDURE statements from parsed nodes. |
| extractCreateTrigger | function |  | `createOtherExtractor.js` | Extracts CREATE TRIGGER statements from parsed nodes. |
| extractCreateTable | function |  | `createTableExtractor.js` | Extracts CREATE TABLE statements from parsed nodes. |
| extractFromDeclaration | function |  | `declarationExportExtractor.js` | Extracts from Declaration from parsed nodes. |
| extractDml | function |  | `dmlExtractor.js` | Extracts DML statements from parsed nodes. |
| extractInsert | function |  | `dmlExtractor.js` | Extracts INSERT statements from parsed nodes. |
| extractUpdate | function |  | `dmlExtractor.js` | Extracts UPDATE statements from parsed nodes. |
| extractDelete | function |  | `dmlExtractor.js` | Extracts DELETE statements from parsed nodes. |
| extractSelect | function |  | `dmlExtractor.js` | Extracts SELECT statements from parsed nodes. |
| extractDrop | function |  | `dropExtractor.js` | Extracts DROP statements from parsed nodes. |
| extractExports | function |  | `exportsExtractor.js` | Extracts export declarations from parsed nodes. |
| visit | arrow |  | `exportsExtractor.js` | Visits matching AST nodes and records the extracted data. |
| extractFunctions | function |  | `functionExtractor.js` | Extracts function declarations from parsed nodes. |
| visit | arrow |  | `functionExtractor.js` | Visits matching AST nodes and records the extracted data. |
| extractImports | function |  | `importExtractor.js` | Extracts import declarations from parsed nodes. |
| visit | arrow |  | `importExtractor.js` | Visits matching AST nodes and records the extracted data. |
| extractRoutes | function |  | `routesExtractor.js` | Extracts route sections from parsed nodes. |
| visit | arrow |  | `routesExtractor.js` | Visits matching AST nodes and records the extracted data. |

## Exports

| Name | Kind | File |
|------|------|------|
| extractAlter | function | `alterExtractor.js` |
| extractCjsExport | function | `cjsExportExtractor.js` |
| extractClasses | function | `classExtractor.js` |
| extractComments | function | `commentExtractor.js` |
| extractOtherCreate | function | `createOtherExtractor.js` |
| extractCreateTable | function | `createTableExtractor.js` |
| extractFromDeclaration | function | `declarationExportExtractor.js` |
| extractDml | function | `dmlExtractor.js` |
| extractDrop | function | `dropExtractor.js` |
| extractExports | function | `exportsExtractor.js` |
| extractFunctions | function | `functionExtractor.js` |
| extractImports | function | `importExtractor.js` |
| extractRoutes | function | `routesExtractor.js` |
