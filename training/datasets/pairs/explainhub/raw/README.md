# ExplainHub


## Overview

| Technology |
|------------|
| Node.js |
| JavaScript |

| Technology | File |
|------------|------|
| Node.js | server.js |
| Node.js | app.js |
| Node.js | index.js |
| Node.js | index.js |
| Node.js | index.js |
| Node.js | index.js |
| Node.js | index.js |
| Node.js | index.js |
| Node.js | index.js |

## Project Info

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Description | explainHub is a software solution that will help you better understand a project if you are new to it, clearly giving you a summary of what the project does. |
| License | ISC |

## Dependencies

| Name | Version | Type |
|------|---------|------|
| @babel/parser | ^7.29.3 | dependencies |
| @clack/prompts | ^1.4.0 | dependencies |
| @vscode/tree-sitter-wasm | ^0.3.1 | dependencies |
| adm-zip | ^0.6.0 | dependencies |
| dotenv | ^17.4.2 | dependencies |
| express | ^5.2.1 | dependencies |
| fast-xml-parser | ^5.9.0 | dependencies |
| node-sql-parser | ^5.4.0 | dependencies |
| ollama | ^0.6.3 | dependencies |
| php-parser | ^3.7.0 | dependencies |
| simple-git | ^3.36.0 | dependencies |
| smol-toml | ^1.7.0 | dependencies |
| web-tree-sitter | ^0.26.9 | dependencies |
| nodemon | ^3.1.14 | dev-dependencies |

## Project Structure

```
ExplainHub/
├── .env.example
├── .github
│   └── workflows
│       └── test.yml
├── .gitignore
├── README.md
├── docs
│   ├── ai-enhancer.md
│   ├── analyzer.md
│   ├── code-parser.md
│   ├── security.md
│   ├── structure-cloner.md
│   ├── structure-extractor.md
│   └── text-generator.md
├── package-lock.json
├── package.json
├── server.js
├── src
│   ├── api
│   │   └── controller.js
│   ├── app.js
│   ├── config
│   │   └── env.js
│   ├── core
│   │   └── analyzer
│   │       └── analyzer.service.js
│   ├── middleware
│   │   └── error.middleware.js
│   ├── modules
│   │   ├── ai-enhancer
│   │   │   ├── index.js
│   │   │   └── prompt
│   │   │       ├── promptMd.js
│   │   │       ├── promptMdEnhancer.js
│   │   │       └── promptTxt.js
│   │   ├── cli
│   │   │   └── index.js
│   │   ├── cloner
│   │   │   └── index.js
│   │   ├── code-parser
│   │   │   ├── errors
│   │   │   │   └── parserError.js
│   │   │   ├── extractors
│   │   │   │   ├── alterExtractor.js
│   │   │   │   ├── cjsExportExtractor.js
│   │   │   │   ├── classExtractor.js
│   │   │   │   ├── commentExtractor.js
│   │   │   │   ├── createOtherExtractor.js
│   │   │   │   ├── createTableExtractor.js
│   │   │   │   ├── declarationExportExtractor.js
│   │   │   │   ├── dmlExtractor.js
│   │   │   │   ├── dropExtractor.js
│   │   │   │   ├── exportsExtractor.js
│   │   │   │   ├── functionExtractor.js
│   │   │   │   ├── importExtractor.js
│   │   │   │   └── routesExtractor.js
│   │   │   ├── fileTypes.js
│   │   │   ├── index.js
│   │   │   ├── parsers
│   │   │   │   ├── cParser.js
│   │   │   │   ├── cargoConfigParser.js
│   │   │   │   ├── cargoLockParser.js
│   │   │   │   ├── cargoTomlParser.js
│   │   │   │   ├── configParser.js
│   │   │   │   ├── csParser.js
│   │   │   │   ├── csprojParser.js
│   │   │   │   ├── cssParser.js
│   │   │   │   ├── dartParser.js
│   │   │   │   ├── goParser.js
│   │   │   │   ├── htmlParser.js
│   │   │   │   ├── iniParser.js
│   │   │   │   ├── javaParser.js
│   │   │   │   ├── jsParser.js
│   │   │   │   ├── ktParser.js
│   │   │   │   ├── parserFactory.js
│   │   │   │   ├── phpParser.js
│   │   │   │   ├── ps1Parser.js
│   │   │   │   ├── pyParser.js
│   │   │   │   ├── rbParser.js
│   │   │   │   ├── rsParser.js
│   │   │   │   ├── rustToolChainParser.js
│   │   │   │   ├── shParser.js
│   │   │   │   ├── slnParser.js
│   │   │   │   ├── sqlParser.js
│   │   │   │   ├── treeSitterFactory.js
│   │   │   │   ├── tsParser.js
│   │   │   │   ├── utils.js
│   │   │   │   └── xamlParser.js
│   │   │   ├── utils
│   │   │   │   └── fileUtils.js
│   │   │   └── wasm
│   │   │       ├── tree-sitter-dart.wasm
│   │   │       └── tree-sitter-kotlin.wasm
│   │   ├── security
│   │   │   ├── index.js
│   │   │   ├── pathValidator.js
│   │   │   ├── repositorySizeValidator.js
│   │   │   └── sensitivePath.js
│   │   ├── structure-extractor
│   │   │   ├── entryRules.js
│   │   │   ├── index.js
│   │   │   └── techRules.js
│   │   └── text-generator
│   │       ├── formatters
│   │       │   ├── md
│   │       │   │   ├── modules.js
│   │       │   │   └── readme.js
│   │       │   ├── txt
│   │       │   │   ├── alterFormatter.js
│   │       │   │   ├── apiFormatter.js
│   │       │   │   ├── commentsFormatter.js
│   │       │   │   ├── dependencyFormatter.js
│   │       │   │   ├── dmlFormatter.js
│   │       │   │   ├── dropsFormatter.js
│   │       │   │   ├── fileFormatter.js
│   │       │   │   ├── headerFormatter.js
│   │       │   │   ├── indexesFormatter.js
│   │       │   │   ├── routinesFormatter.js
│   │       │   │   ├── statsFormatter.js
│   │       │   │   ├── tablesFormatter.js
│   │       │   │   ├── triggersFormatter.js
│   │       │   │   └── viewsFormatter.js
│   │       │   └── utils.js
│   │       └── index.js
│   └── routes
│       └── analyzer.routes.js
├── test
│   ├── ai-enhancer.test.js
│   ├── cloner.test.js
│   ├── dart-parser.test.js
│   ├── kt-parser.test.js
│   ├── manual-cloner-test.manual.js
│   ├── md-flow.test.js
│   ├── security.test.js
│   ├── sh-parser.test.js
│   ├── test-ai-enhancer.manual.js
│   ├── test-code-parser.manual.js
│   ├── test-text-generator.manual.js
│   └── zip-flow.test.js
└── training
    ├── .gitignore
    ├── README.md
    ├── colab
    │   └── soup-explainhub.ipynb
    ├── data
    │   ├── .gitkeep
    │   └── example.jsonl
    ├── datasets
    │   ├── manifest.json
    │   └── pairs
    │       └── example-demo
    │           ├── corrected
    │           │   ├── README.md
    │           │   └── docs
    │           │       └── src.md
    │           └── raw
    │               ├── README.md
    │               └── docs
    │                   └── src.md
    ├── scripts
    │   ├── build-dataset.mjs
    │   ├── evaluate.mjs
    │   ├── lib
    │   │   ├── markdown-contract.mjs
    │   │   └── metrics.mjs
    │   └── make-example.mjs
    ├── soup.smoke.yaml
    └── soup.yaml
```

## Modules

| Module | Files | Description |
|--------|-------|-------------|
| [src](docs/src.md) | 1 | JavaScript |
| [api](docs/api.md) | 1 | JavaScript |
| [config](docs/config.md) | 1 | JavaScript |
| [analyzer](docs/analyzer.md) | 1 | JavaScript |
| [middleware](docs/middleware.md) | 1 | JavaScript |
| [ai-enhancer](docs/ai-enhancer.md) | 1 | JavaScript |
| [prompt](docs/prompt.md) | 3 | JavaScript |
| [cli](docs/cli.md) | 1 | JavaScript |
| [cloner](docs/cloner.md) | 1 | JavaScript |
| [code-parser](docs/code-parser.md) | 2 | JavaScript |
| [errors](docs/errors.md) | 1 | JavaScript |
| [extractors](docs/extractors.md) | 13 | JavaScript |
| [parsers](docs/parsers.md) | 29 | JavaScript |
| [utils](docs/utils.md) | 1 | JavaScript |
| [security](docs/security.md) | 4 | JavaScript |
| [structure-extractor](docs/structure-extractor.md) | 3 | JavaScript |
| [text-generator](docs/text-generator.md) | 1 | JavaScript |
| [formatters](docs/formatters.md) | 1 | JavaScript |
| [md](docs/md.md) | 2 | JavaScript |
| [txt](docs/txt.md) | 14 | JavaScript |
| [routes](docs/routes.md) | 1 | JavaScript |
| [test](docs/test.md) | 12 | JavaScript |
| [scripts](docs/scripts.md) | 3 | JavaScript |
| [lib](docs/lib.md) | 2 | JavaScript |