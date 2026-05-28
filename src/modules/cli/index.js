#!/usr/bin/env node

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as c from "@clack/prompts";

import { AnalyzerService } from "../../core/analyzer/analyzer.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env"), quiet: true });
const service = new AnalyzerService();

async function main() {
  c.intro("ExplainHub");

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

  const result = await service.analyze(projectPath);
  c.outro("Análisis completado");
  console.log(result.summary);
}

main().catch(console.error);
