# Module: parsers


## File Structure

| File | Purpose |
|------|---------|
| `cParser.js` | JavaScript module |
| `cargoConfigParser.js` | Application configuration |
| `cargoLockParser.js` | JavaScript module |
| `cargoTomlParser.js` | JavaScript module |
| `configParser.js` | Application configuration |
| `csParser.js` | JavaScript module |
| `csprojParser.js` | JavaScript module |
| `cssParser.js` | JavaScript module |
| `dartParser.js` | JavaScript module |
| `goParser.js` | JavaScript module |
| `htmlParser.js` | JavaScript module |
| `iniParser.js` | JavaScript module |
| `javaParser.js` | JavaScript module |
| `jsParser.js` | JavaScript module |
| `ktParser.js` | JavaScript module |
| `parserFactory.js` | JavaScript module |
| `phpParser.js` | JavaScript module |
| `ps1Parser.js` | JavaScript module |
| `pyParser.js` | JavaScript module |
| `rbParser.js` | JavaScript module |
| `rsParser.js` | JavaScript module |
| `rustToolChainParser.js` | JavaScript module |
| `shParser.js` | JavaScript module |
| `slnParser.js` | JavaScript module |
| `sqlParser.js` | JavaScript module |
| `treeSitterFactory.js` | JavaScript module |
| `tsParser.js` | JavaScript module |
| `utils.js` | Utility functions and helpers |
| `xamlParser.js` | JavaScript module |

## Functions

| Name | Kind | Async | File |
|------|------|-------|------|
| getMethodParams | function |  | `cParser.js` |
| parseCPP | function | yes | `cParser.js` |
| walk | function |  | `cParser.js` |
| extractBuild | function |  | `cargoConfigParser.js` |
| extractRegistries | function |  | `cargoConfigParser.js` |
| extractNet | function |  | `cargoConfigParser.js` |
| extractAliases | function |  | `cargoConfigParser.js` |
| extractTargets | function |  | `cargoConfigParser.js` |
| parseCargoConfig | function | yes | `cargoConfigParser.js` |
| extractPackages | function |  | `cargoLockParser.js` |
| extractRootPackage | function |  | `cargoLockParser.js` |
| parseCargoLock | function | yes | `cargoLockParser.js` |
| extractPackage | function |  | `cargoTomlParser.js` |
| extractDependencies | function |  | `cargoTomlParser.js` |
| extractFeatures | function |  | `cargoTomlParser.js` |
| extractProfiles | function |  | `cargoTomlParser.js` |
| extractWorkspace | function |  | `cargoTomlParser.js` |
| extractBuildTargets | function |  | `cargoTomlParser.js` |
| extractPatches | function |  | `cargoTomlParser.js` |
| extractPlatformDeps | function |  | `cargoTomlParser.js` |
| collectAllDeps | function |  | `cargoTomlParser.js` |
| parseCargoToml | function | yes | `cargoTomlParser.js` |
| parseAppConfig | function |  | `configParser.js` |
| parsePackagesConfig | function |  | `configParser.js` |
| parseConfig | function |  | `configParser.js` |
| getUsingSource | function |  | `csParser.js` |
| isPublic | function |  | `csParser.js` |
| getAttrArgText | function |  | `csParser.js` |
| extractRoutes | function |  | `csParser.js` |
| getMethodParams | function |  | `csParser.js` |
| parseCs | function | yes | `csParser.js` |
| walk | function |  | `csParser.js` |
| extractVersionFromHintPath | function |  | `csprojParser.js` |
| extractVersionFromInclude | function |  | `csprojParser.js` |
| getPropValue | function |  | `csprojParser.js` |
| parseCsproj | function |  | `csprojParser.js` |
| parseCss | function |  | `cssParser.js` |
| extractName | function |  | `dartParser.js` |
| extractTypeParams | function |  | `dartParser.js` |
| extractExtends | function |  | `dartParser.js` |
| extractParams | function |  | `dartParser.js` |
| walkParams | function |  | `dartParser.js` |
| extractReturnType | function |  | `dartParser.js` |
| extractClassKind | function |  | `dartParser.js` |
| extractExtensionOnType | function |  | `dartParser.js` |
| extractClassBody | function |  | `dartParser.js` |
| extractMethodFromDecl | function |  | `dartParser.js` |
| extractMethods | function |  | `dartParser.js` |
| parseDart | function | yes | `dartParser.js` |
| walk | function |  | `dartParser.js` |
| getImportSource | function |  | `goParser.js` |
| isExported | function |  | `goParser.js` |
| getMethodParams | function |  | `goParser.js` |
| parseGo | function | yes | `goParser.js` |
| walk | function |  | `goParser.js` |
| parseHtml | function |  | `htmlParser.js` |
| extractSections | function |  | `iniParser.js` |
| parseIni | function | yes | `iniParser.js` |
| getImportSource | function |  | `javaParser.js` |
| isPublic | function |  | `javaParser.js` |
| getAttrArgText | function |  | `javaParser.js` |
| extractRoute | function |  | `javaParser.js` |
| getMethodParams | function |  | `javaParser.js` |
| parseJava | function | yes | `javaParser.js` |
| walk | function |  | `javaParser.js` |
| parseJavaScript | function |  | `jsParser.js` |
| parseKotlin | function | yes | `ktParser.js` |
| walk | function |  | `ktParser.js` |
| extractName | function |  | `ktParser.js` |
| extractModifiers | function |  | `ktParser.js` |
| extractSuperclass | function |  | `ktParser.js` |
| extractMethods | function |  | `ktParser.js` |
| walkClassBody | function |  | `ktParser.js` |
| extractFunctionName | function |  | `ktParser.js` |
| extractParams | function |  | `ktParser.js` |
| extractPropertyName | function |  | `ktParser.js` |
| parseByType | function | yes | `parserFactory.js` |
| parsePhp | function |  | `phpParser.js` |
| walk | function |  | `phpParser.js` |
| extractAttrRoutes | function |  | `phpParser.js` |
| getCommandName | function |  | `ps1Parser.js` |
| getCommandArgValue | function |  | `ps1Parser.js` |
| extractStringFromArg | function |  | `ps1Parser.js` |
| extractParams | function |  | `ps1Parser.js` |
| isTopLevelFunction | function |  | `ps1Parser.js` |
| extractClassMethods | function |  | `ps1Parser.js` |
| parsePs1 | function | yes | `ps1Parser.js` |
| walk | function |  | `ps1Parser.js` |
| ensurePython | function | yes | `pyParser.js` |
| execPython | function |  | `pyParser.js` |
| parsePython | function | yes | `pyParser.js` |
| parsePythonBatch | function | yes | `pyParser.js` |
| getMethodName | function |  | `rbParser.js` |
| getMethodParams | function |  | `rbParser.js` |
| extractCallName | function |  | `rbParser.js` |
| extractStringArg | function |  | `rbParser.js` |
| extractRoutePath | function |  | `rbParser.js` |
| isTopLevel | function |  | `rbParser.js` |
| extractMethods | function |  | `rbParser.js` |
| parseRb | function | yes | `rbParser.js` |
| walk | function |  | `rbParser.js` |
| getUseSource | function |  | `rsParser.js` |
| isPublic | function |  | `rsParser.js` |
| getAttrArgText | function |  | `rsParser.js` |
| extractRoutes | function |  | `rsParser.js` |
| getMethodParams | function |  | `rsParser.js` |
| parseRs | function | yes | `rsParser.js` |
| walk | function |  | `rsParser.js` |
| extractToolchain | function |  | `rustToolChainParser.js` |
| parseRustToolchain | function | yes | `rustToolChainParser.js` |
| stripQuotes | function |  | `shParser.js` |
| getCommandName | function |  | `shParser.js` |
| commandArgs | function |  | `shParser.js` |
| extractHttpRoute | function |  | `shParser.js` |
| parseSh | function | yes | `shParser.js` |
| walk | function |  | `shParser.js` |
| parseSln | function |  | `slnParser.js` |
| splitBatches | function |  | `sqlParser.js` |
| splitStatements | function |  | `sqlParser.js` |
| extractTableBody | function |  | `sqlParser.js` |
| extractTableColumns | function |  | `sqlParser.js` |
| extractParamsFromText | function |  | `sqlParser.js` |
| parseParamList | function |  | `sqlParser.js` |
| extractFromRaw | function |  | `sqlParser.js` |
| detectDialect | function |  | `sqlParser.js` |
| crearAcumuladores | function |  | `sqlParser.js` |
| processNodes | function |  | `sqlParser.js` |
| mergeResults | function |  | `sqlParser.js` |
| parseSql | function |  | `sqlParser.js` |
| getTreeSitterParser | function | yes | `treeSitterFactory.js` |
| parseTypeScript | function |  | `tsParser.js` |
| toArray | function |  | `utils.js` |
| getAttrs | function |  | `xamlParser.js` |
| getChildren | function |  | `xamlParser.js` |
| parseXaml | function |  | `xamlParser.js` |
| walk | function |  | `xamlParser.js` |

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