# Module: parsers

Language-specific parsers that turn source files into the shared documentation model.


## File Structure

| File | Purpose |
| ------ | ------ |
| `cParser.js` | Parser for C files that feeds the shared document model |
| `cargoConfigParser.js` | Parser for Cargo configuration files that feeds the shared document model |
| `cargoLockParser.js` | Parser for Cargo.lock files that feeds the shared document model |
| `cargoTomlParser.js` | Parser for Cargo.toml files that feeds the shared document model |
| `configParser.js` | Parser for configuration files that feeds the shared document model |
| `csParser.js` | Parser for C# files that feeds the shared document model |
| `csprojParser.js` | Parser for C# project files that feeds the shared document model |
| `cssParser.js` | Parser for CSS files that feeds the shared document model |
| `dartParser.js` | Parser for Dart files that feeds the shared document model |
| `goParser.js` | Parser for Go files that feeds the shared document model |
| `htmlParser.js` | Parser for HTML files that feeds the shared document model |
| `iniParser.js` | Parser for INI files that feeds the shared document model |
| `javaParser.js` | Parser for Java files that feeds the shared document model |
| `jsParser.js` | Parser for JavaScript files that feeds the shared document model |
| `ktParser.js` | Parser for Kotlin files that feeds the shared document model |
| `parserFactory.js` | Selects the parser implementation for a given file type |
| `phpParser.js` | Parser for PHP files that feeds the shared document model |
| `ps1Parser.js` | Parser for PowerShell files that feeds the shared document model |
| `pyParser.js` | Parser for Python files that feeds the shared document model |
| `rbParser.js` | Parser for Ruby files that feeds the shared document model |
| `rsParser.js` | Parser for Rust files that feeds the shared document model |
| `rustToolChainParser.js` | Parser for Rust toolchain files that feeds the shared document model |
| `shParser.js` | Parser for shell files that feeds the shared document model |
| `slnParser.js` | Parser for Visual Studio solution files that feeds the shared document model |
| `sqlParser.js` | Parser for SQL files that feeds the shared document model |
| `treeSitterFactory.js` | Loads and caches tree-sitter parsers for supported languages |
| `tsParser.js` | Parser for TypeScript files that feeds the shared document model |
| `utils.js` | Shared coercion helpers used by the language-specific parsers |
| `xamlParser.js` | Parser for XAML files that feeds the shared document model |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| getMethodParams | function |  | `cParser.js` | Returns method Params from the supplied input. |
| parseCPP | function | yes | `cParser.js` | Parses C++ input into the shared document model. |
| walk | function |  | `cParser.js` | Walks the nodes and visits matching entries. |
| extractBuild | function |  | `cargoConfigParser.js` | Extracts build from parsed nodes. |
| extractRegistries | function |  | `cargoConfigParser.js` | Extracts registries from parsed nodes. |
| extractNet | function |  | `cargoConfigParser.js` | Extracts net from parsed nodes. |
| extractAliases | function |  | `cargoConfigParser.js` | Extracts aliases from parsed nodes. |
| extractTargets | function |  | `cargoConfigParser.js` | Extracts targets from parsed nodes. |
| parseCargoConfig | function | yes | `cargoConfigParser.js` | Parses cargo config input into the shared document model. |
| extractPackages | function |  | `cargoLockParser.js` | Extracts packages from parsed nodes. |
| extractRootPackage | function |  | `cargoLockParser.js` | Extracts root Package from parsed nodes. |
| parseCargoLock | function | yes | `cargoLockParser.js` | Parses cargo.lock input into the shared document model. |
| extractPackage | function |  | `cargoTomlParser.js` | Extracts package from parsed nodes. |
| extractDependencies | function |  | `cargoTomlParser.js` | Extracts dependencies from parsed nodes. |
| extractFeatures | function |  | `cargoTomlParser.js` | Extracts features from parsed nodes. |
| extractProfiles | function |  | `cargoTomlParser.js` | Extracts profiles from parsed nodes. |
| extractWorkspace | function |  | `cargoTomlParser.js` | Extracts workspace from parsed nodes. |
| extractBuildTargets | function |  | `cargoTomlParser.js` | Extracts build Targets from parsed nodes. |
| extractPatches | function |  | `cargoTomlParser.js` | Extracts patches from parsed nodes. |
| extractPlatformDeps | function |  | `cargoTomlParser.js` | Extracts platform Deps from parsed nodes. |
| collectAllDeps | function |  | `cargoTomlParser.js` | Collects all Deps from the input. |
| parseCargoToml | function | yes | `cargoTomlParser.js` | Parses cargo.toml input into the shared document model. |
| parseAppConfig | function |  | `configParser.js` | Parses app Config input into the shared document model. |
| parsePackagesConfig | function |  | `configParser.js` | Parses packages Config input into the shared document model. |
| parseConfig | function |  | `configParser.js` | Parses config input into the shared document model. |
| getUsingSource | function |  | `csParser.js` | Returns using Source from the supplied input. |
| isPublic | function |  | `csParser.js` | Checks whether public applies. |
| getAttrArgText | function |  | `csParser.js` | Returns attr Arg Text from the supplied input. |
| extractRoutes | function |  | `csParser.js` | Extracts route sections from parsed nodes. |
| getMethodParams | function |  | `csParser.js` | Returns method Params from the supplied input. |
| parseCs | function | yes | `csParser.js` | Parses cs input into the shared document model. |
| walk | function |  | `csParser.js` | Walks the nodes and visits matching entries. |
| extractVersionFromHintPath | function |  | `csprojParser.js` | Extracts version From Hint Path from parsed nodes. |
| extractVersionFromInclude | function |  | `csprojParser.js` | Extracts version From Include from parsed nodes. |
| getPropValue | function |  | `csprojParser.js` | Returns prop Value from the supplied input. |
| parseCsproj | function |  | `csprojParser.js` | Parses .csproj input into the shared document model. |
| parseCss | function |  | `cssParser.js` | Parses CSS input into the shared document model. |
| extractName | function |  | `dartParser.js` | Extracts name from parsed nodes. |
| extractTypeParams | function |  | `dartParser.js` | Extracts type Params from parsed nodes. |
| extractExtends | function |  | `dartParser.js` | Extracts extends from parsed nodes. |
| extractParams | function |  | `dartParser.js` | Extracts params from parsed nodes. |
| walkParams | function |  | `dartParser.js` | Walks params and visits matching entries. |
| extractReturnType | function |  | `dartParser.js` | Extracts return Type from parsed nodes. |
| extractClassKind | function |  | `dartParser.js` | Extracts class Kind from parsed nodes. |
| extractExtensionOnType | function |  | `dartParser.js` | Extracts extension On Type from parsed nodes. |
| extractClassBody | function |  | `dartParser.js` | Extracts class Body from parsed nodes. |
| extractMethodFromDecl | function |  | `dartParser.js` | Extracts method From Decl from parsed nodes. |
| extractMethods | function |  | `dartParser.js` | Extracts methods from parsed nodes. |
| parseDart | function | yes | `dartParser.js` | Parses dart input into the shared document model. |
| walk | function |  | `dartParser.js` | Walks the nodes and visits matching entries. |
| getImportSource | function |  | `goParser.js` | Returns import Source from the supplied input. |
| isExported | function |  | `goParser.js` | Checks whether exported applies. |
| getMethodParams | function |  | `goParser.js` | Returns method Params from the supplied input. |
| parseGo | function | yes | `goParser.js` | Parses go input into the shared document model. |
| walk | function |  | `goParser.js` | Walks the nodes and visits matching entries. |
| parseHtml | function |  | `htmlParser.js` | Parses HTML input into the shared document model. |
| extractSections | function |  | `iniParser.js` | Extracts sections from parsed nodes. |
| parseIni | function | yes | `iniParser.js` | Parses INI input into the shared document model. |
| getImportSource | function |  | `javaParser.js` | Returns import Source from the supplied input. |
| isPublic | function |  | `javaParser.js` | Checks whether public applies. |
| getAttrArgText | function |  | `javaParser.js` | Returns attr Arg Text from the supplied input. |
| extractRoute | function |  | `javaParser.js` | Extracts route from parsed nodes. |
| getMethodParams | function |  | `javaParser.js` | Returns method Params from the supplied input. |
| parseJava | function | yes | `javaParser.js` | Parses java input into the shared document model. |
| walk | function |  | `javaParser.js` | Walks the nodes and visits matching entries. |
| parseJavaScript | function |  | `jsParser.js` | Parses java Script input into the shared document model. |
| parseKotlin | function | yes | `ktParser.js` | Parses kotlin input into the shared document model. |
| walk | function |  | `ktParser.js` | Walks the nodes and visits matching entries. |
| extractName | function |  | `ktParser.js` | Extracts name from parsed nodes. |
| extractModifiers | function |  | `ktParser.js` | Extracts modifiers from parsed nodes. |
| extractSuperclass | function |  | `ktParser.js` | Extracts superclass from parsed nodes. |
| extractMethods | function |  | `ktParser.js` | Extracts methods from parsed nodes. |
| walkClassBody | function |  | `ktParser.js` | Walks class Body and visits matching entries. |
| extractFunctionName | function |  | `ktParser.js` | Extracts function Name from parsed nodes. |
| extractParams | function |  | `ktParser.js` | Extracts params from parsed nodes. |
| extractPropertyName | function |  | `ktParser.js` | Extracts property Name from parsed nodes. |
| parseByType | function | yes | `parserFactory.js` | Parses by Type input into the shared document model. |
| parsePhp | function |  | `phpParser.js` | Parses PHP input into the shared document model. |
| walk | function |  | `phpParser.js` | Walks the nodes and visits matching entries. |
| extractAttrRoutes | function |  | `phpParser.js` | Extracts attr Routes from parsed nodes. |
| getCommandName | function |  | `ps1Parser.js` | Returns command Name from the supplied input. |
| getCommandArgValue | function |  | `ps1Parser.js` | Returns command Arg Value from the supplied input. |
| extractStringFromArg | function |  | `ps1Parser.js` | Extracts string From Arg from parsed nodes. |
| extractParams | function |  | `ps1Parser.js` | Extracts params from parsed nodes. |
| isTopLevelFunction | function |  | `ps1Parser.js` | Checks whether top Level Function applies. |
| extractClassMethods | function |  | `ps1Parser.js` | Extracts class Methods from parsed nodes. |
| parsePs1 | function | yes | `ps1Parser.js` | Parses ps1 input into the shared document model. |
| walk | function |  | `ps1Parser.js` | Walks the nodes and visits matching entries. |
| ensurePython | function | yes | `pyParser.js` | Ensures python is available. |
| execPython | function |  | `pyParser.js` | Executes python and returns its output. |
| parsePython | function | yes | `pyParser.js` | Parses python input into the shared document model. |
| parsePythonBatch | function | yes | `pyParser.js` | Parses python Batch input into the shared document model. |
| getMethodName | function |  | `rbParser.js` | Returns method Name from the supplied input. |
| getMethodParams | function |  | `rbParser.js` | Returns method Params from the supplied input. |
| extractCallName | function |  | `rbParser.js` | Extracts call Name from parsed nodes. |
| extractStringArg | function |  | `rbParser.js` | Extracts string Arg from parsed nodes. |
| extractRoutePath | function |  | `rbParser.js` | Extracts route Path from parsed nodes. |
| isTopLevel | function |  | `rbParser.js` | Checks whether top Level applies. |
| extractMethods | function |  | `rbParser.js` | Extracts methods from parsed nodes. |
| parseRb | function | yes | `rbParser.js` | Parses rb input into the shared document model. |
| walk | function |  | `rbParser.js` | Walks the nodes and visits matching entries. |
| getUseSource | function |  | `rsParser.js` | Returns use Source from the supplied input. |
| isPublic | function |  | `rsParser.js` | Checks whether public applies. |
| getAttrArgText | function |  | `rsParser.js` | Returns attr Arg Text from the supplied input. |
| extractRoutes | function |  | `rsParser.js` | Extracts route sections from parsed nodes. |
| getMethodParams | function |  | `rsParser.js` | Returns method Params from the supplied input. |
| parseRs | function | yes | `rsParser.js` | Parses rs input into the shared document model. |
| walk | function |  | `rsParser.js` | Walks the nodes and visits matching entries. |
| extractToolchain | function |  | `rustToolChainParser.js` | Extracts toolchain from parsed nodes. |
| parseRustToolchain | function | yes | `rustToolChainParser.js` | Parses rust Toolchain input into the shared document model. |
| stripQuotes | function |  | `shParser.js` | Strips quotes from the input. |
| getCommandName | function |  | `shParser.js` | Returns command Name from the supplied input. |
| commandArgs | function |  | `shParser.js` | Implements the command Args helper used by this module. |
| extractHttpRoute | function |  | `shParser.js` | Extracts http Route from parsed nodes. |
| parseSh | function | yes | `shParser.js` | Parses sh input into the shared document model. |
| walk | function |  | `shParser.js` | Walks the nodes and visits matching entries. |
| parseSln | function |  | `slnParser.js` | Parses sln input into the shared document model. |
| splitBatches | function |  | `sqlParser.js` | Splits batches into smaller parts. |
| splitStatements | function |  | `sqlParser.js` | Splits statements into smaller parts. |
| extractTableBody | function |  | `sqlParser.js` | Extracts table Body from parsed nodes. |
| extractTableColumns | function |  | `sqlParser.js` | Extracts table Columns from parsed nodes. |
| extractParamsFromText | function |  | `sqlParser.js` | Extracts params From Text from parsed nodes. |
| parseParamList | function |  | `sqlParser.js` | Parses param List input into the shared document model. |
| extractFromRaw | function |  | `sqlParser.js` | Extracts from Raw from parsed nodes. |
| detectDialect | function |  | `sqlParser.js` | Detects dialect from the repository contents. |
| crearAcumuladores | function |  | `sqlParser.js` | Implements the crear Acumuladores helper used by this module. |
| processNodes | function |  | `sqlParser.js` | Processes nodes and records the result. |
| mergeResults | function |  | `sqlParser.js` | Merges results into a single result. |
| parseSql | function |  | `sqlParser.js` | Parses SQL input into the shared document model. |
| getTreeSitterParser | function | yes | `treeSitterFactory.js` | Returns tree sitter Parser from the supplied input. |
| parseTypeScript | function |  | `tsParser.js` | Parses type Script input into the shared document model. |
| toArray | function |  | `utils.js` | Normalizes a value into an array. |
| getAttrs | function |  | `xamlParser.js` | Returns attrs from the supplied input. |
| getChildren | function |  | `xamlParser.js` | Returns children from the supplied input. |
| parseXaml | function |  | `xamlParser.js` | Parses XAML input into the shared document model. |
| walk | function |  | `xamlParser.js` | Walks the nodes and visits matching entries. |

## Exports

| Name | Kind | File |
|------|------|------|
| parseCPP | function | `cParser.js` |
| parseCargoConfig | function | `cargoConfigParser.js` |
| parseCargoLock | function | `cargoLockParser.js` |
| parseCargoToml | function | `cargoTomlParser.js` |
| parseConfig | function | `configParser.js` |
| parseCs | function | `csParser.js` |
| parseCsproj | function | `csprojParser.js` |
| parseCss | function | `cssParser.js` |
| parseDart | function | `dartParser.js` |
| parseGo | function | `goParser.js` |
| parseHtml | function | `htmlParser.js` |
| parseIni | function | `iniParser.js` |
| parseJava | function | `javaParser.js` |
| parseJavaScript | function | `jsParser.js` |
| parseKotlin | function | `ktParser.js` |
| parseByType | function | `parserFactory.js` |
| parsePhp | function | `phpParser.js` |
| parsePs1 | function | `ps1Parser.js` |
| parsePython | function | `pyParser.js` |
| parsePythonBatch | function | `pyParser.js` |
| parseRb | function | `rbParser.js` |
| parseRs | function | `rsParser.js` |
| parseRustToolchain | function | `rustToolChainParser.js` |
| parseSh | function | `shParser.js` |
| parseSln | function | `slnParser.js` |
| detectDialect | function | `sqlParser.js` |
| parseSql | function | `sqlParser.js` |
| getTreeSitterParser | function | `treeSitterFactory.js` |
| parseTypeScript | function | `tsParser.js` |
| toArray | function | `utils.js` |
| parseXaml | function | `xamlParser.js` |
