#!/usr/bin/env node

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as c from "@clack/prompts";
import { parseArgs } from "node:util";

import { saveFile } from "../code-parser/utils/fileUtils.js";
import { AnalyzerService } from "../../core/analyzer/analyzer.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env"), quiet: true });
const service = new AnalyzerService();

const YELLOW = "\x1b[33m";
const BLACK = "\x1b[90m";
const RESET = "\x1b[0m";

const EXPLAIN = [
  "███████╗██╗  ██╗██████╗ ██╗      █████╗ ██╗███╗   ██╗",
  "██╔════╝╚██╗██╔╝██╔══██╗██║     ██╔══██╗██║████╗  ██║",
  "█████╗   ╚███╔╝ ██████╔╝██║     ███████║██║██╔██╗ ██║",
  "██╔══╝   ██╔██╗ ██╔═══╝ ██║     ██╔══██║██║██║╚██╗██║",
  "███████╗██╔╝ ██╗██║     ███████╗██║  ██║██║██║ ╚████║",
  "╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝",
];

const HUB = [
  "██╗  ██╗██╗   ██╗██████╗ ",
  "██║  ██║██║   ██║██╔══██╗",
  "███████║██║   ██║██████╔╝",
  "██╔══██║██║   ██║██╔══██╗",
  "██║  ██║╚██████╔╝██████╔╝",
  "╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ",
];

function printBanner() {
  for (let i = 0; i < EXPLAIN.length; i++) {
    console.log(YELLOW + EXPLAIN[i] + BLACK + HUB[i] + RESET);
  }
  console.log();
}

async function main() {
  if (process.argv.length > 2) return runNonInteractive();
  printBanner();
  const typeProject = await c.select({
    message: "Elige donde esta tu proyecto",
    options: [
      { value: "url", label: "Url en la nube" },
      { value: "path", label: "Ruta en los archivos" },
      { value: "zip", label: ".zip" },
    ],
  });

  if (c.isCancel(typeProject)) {
    c.outro("Cancelado");
    process.exit(0);
  }

  const format = await c.select({
    message: "¿En qué formato quieres el informe?",
    options: [
      { value: "txt", label: "Texto plano" },
      { value: "md", label: "Markdown" },
    ],
  });
  if (c.isCancel(format)) {
    c.outro("Cancelado");
    process.exit(0);
  }
  const language = await c.select({
    message: "¿En qué idioma quieres el informe?",
    options: [
      { value: "es", label: "Español" },
      { value: "en", label: "English" },
    ],
  });
  if (c.isCancel(language)) {
    c.outro("Cancelado");
    process.exit(0);
  }

  let projectPath;

  if (typeProject === "url") {
    projectPath = await c.text({
      message: "Ingrese la url del repositorio",
      placeholder: "https://github.com/tadeolmd-ubu/ExplainHub",
    });
  } else if (typeProject === "path") {
    projectPath = await c.text({
      message: "Ingrese la ruta del proyecto",
      placeholder: "/home/tadeofed/Escritorio/mi-proyecto",
    });
  } else if (typeProject === "zip") {
    projectPath = await c.text({
      message: "Ingrese la ruta del .zip",
      placeholder: "/home/tadeofed/Escritorio/proyecto.zip",
    });
  }

  if (c.isCancel(projectPath)) {
    c.outro("Cancelado");
    process.exit(0);
  }

  const result = await service.analyze(projectPath, format, language);
  c.outro("Análisis completado");
  console.log(result.summary);
  printResultPaths(result);
  if (format !== "md") {
    const shouldSave = await c.confirm({
      message: "¿Guardar el resultado en un archivo?",
    });

    if (c.isCancel(shouldSave)) {
      c.outro("Cancelado");
      process.exit(0);
    }

    if (shouldSave) {
      const filePath = await c.text({
        message: "Ruta del archivo",
        placeholder: `./summary.${format}`,
      });

      if (c.isCancel(filePath)) {
        c.outro("Cancelado");
        process.exit(0);
      }

      await saveFile(result.summary, filePath);
      c.outro(`Guardado en ${filePath}`);
    }
  }
}

function printResultPaths(result) {
  if (result.repoPath) console.log(`\nProyecto disponible en: ${result.repoPath}`);
  for (const output of result.outputPaths || []) console.log(`Documento: ${output}`);
  for (const diagnostic of result.diagnostics || []) console.error(`[${diagnostic.stage}] ${diagnostic.filePath || ""} ${diagnostic.message}`);
}

async function runNonInteractive() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: "string", default: "txt" }, language: { type: "string", default: "en" },
      output: { type: "string" }, "no-ai": { type: "boolean", default: false }, help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log("Usage: explain <project|url|zip> [--format txt|md] [--language en|es] [--output path] [--no-ai]\nMarkdown output is a directory; text output is a new file.");
    return;
  }
  if (positionals.length !== 1) throw new Error("Provide exactly one project path, URL or ZIP. Use --help for usage.");
  if (!["txt", "md"].includes(values.format) || !["en", "es"].includes(values.language)) throw new Error("Invalid format or language");
  const result = await service.analyze(positionals[0], values.format, values.language, { ai: !values["no-ai"], outputDir: values.format === "md" ? values.output : undefined });
  console.log(result.summary);
  printResultPaths(result);
  if (values.output && values.format === "txt") await saveFile(result.summary, values.output);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
