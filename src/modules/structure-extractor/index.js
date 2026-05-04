import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { techRules } from "./techRules.js";
import { entryRules } from "./entryRules.js";

export class StructureExtractor {
  constructor() {
    this.ignoredNames = new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      "coverage",
      ".env",
    ]);
  }

  async extract(projectPath) {
    try {
      // Validar que la ruta exista
      await fs.access(projectPath, constants.F_OK);

      // Obtener metadata
      const stat = await fs.stat(projectPath);

      // Validar que sea directorio
      // (por el momento si es diferente a un directorio, acaba aqui)
      // luego debera checkear mas cosas
      if (!stat.isDirectory()) {
        throw new Error("The path is not a directory.");
      }

      const tree = await this.buildTree(projectPath);

      const technologies = await this.detectTechnologies(tree);

      const entryPoints = await this.findEntryPoints(tree, technologies);

      return { tree, technologies, entryPoints };
    } catch (error) {
      console.error("ERROR REAL:", error);
      throw error;
    }
  }

  // buildTree
  //    ↓
  // processNode (root)
  //    ↓
  // createDirectoryNode
  //    ↓
  // readDirectory
  //    ↓
  // processNode (hijos)
  //    ↓
  // recursión...

  //
  // INICIA EL PROCESO Y DEVUELVE EL OUTPUT SOLAMENTE
  //
  async buildTree(rootPath) {
    return this.processNode(rootPath);
  }

  //
  // DEFINE SI UN NODO ES ARCHIVO O DIRECTORIO
  //
  // QUE TIPO DE NODO SOY Y COMO ME CONSTRUYO
  async processNode(currentPath) {
    const stat = await fs.stat(currentPath);

    if (stat.isDirectory()) {
      return await this.createDirectoryNode(currentPath);
    } else {
      return await this.createFileNode(currentPath);
    }
  }

  // 1. obtener nombre del directorio
  // 2. leer contenido (readDirectory)
  // 3. iterar sobre cada elemento
  // 4. aplicar shouldIgnore
  // 5. construir path hijo
  // 6. llamar processNode (recursión)
  // 7. guardar resultados en children[]
  // 8. retornar nodo final
  //
  // CONSTRUYE UN NODO SIMPLE
  //
  async createFileNode(currentPath) {
    const name = path.basename(currentPath);

    return {
      name,
      type: "file",
    };
  }

  //
  // CONSTRUYE UN NODO DE CARPETA
  //
  async createDirectoryNode(currentPath) {
    const name = path.basename(currentPath);

    const items = await this.readDirectory(currentPath);

    const children = [];

    for (const item of items) {
      if (this.shouldIgnore(item)) continue;

      const childPath = path.join(currentPath, item);

      const childNode = await this.processNode(childPath);

      children.push(childNode);
    }

    return {
      name,
      type: "directory",
      children,
    };
  }

  //
  // OBTIENE LA LISTA DE ARCHIVOS QUE TIENE UN DIRECTORIO
  //
  async readDirectory(dirPath) {
    const items = await fs.readdir(dirPath);
    return items;
  }

  //
  // DECIDE QUE TIPO DE ARCHIVOS IGNORAR
  //
  shouldIgnore(name) {
    return this.ignoredNames.has(name);
  }

  //
  // RECIBE COMO PARAMETRO EL ARBOL YA PROCESADO Y DETECTA PATRONES
  // DE NOMBRES DE LAS TECNOLOGIAS UTILIZADAS

  async detectTechnologies(tree) {
    const technologies = new Set();

    const traverse = (node) => {
      if (node.type === "file") {
        const exactTech = techRules.exact[node.name];
        if (exactTech) {
          technologies.add(exactTech);
        }

        for (const ext in techRules.extensions) {
          if (node.name.endsWith(ext)) {
            technologies.add(techRules.extensions[ext]);
          }
        }
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(tree);

    return Array.from(technologies);
  }

  async findEntryPoints(tree, technologies) {
    const entryPoints = {};

    // inicializar estructura
    for (const tech of technologies) {
      entryPoints[tech] = [];
    }

    const traverse = (node) => {
      if (node.type === "file") {
        for (const tech of technologies) {
          const possibleEntries = entryRules[tech];

          if (!possibleEntries) continue;

          if (possibleEntries.includes(node.name)) {
            entryPoints[tech].push(node.name);
          }
        }
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(tree);

    return entryPoints;
  }
}
