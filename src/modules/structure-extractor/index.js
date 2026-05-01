import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "path";

export async function extract(projectPath) {
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
  } catch (error) {
    throw new Error("Invalid project path.");
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
async function buildTree(rootPath) {}

//
// DEFINE SI UN NODO ES ARCHIVO O DIRECTORIO
//
async function processNode(currentPath) {}

//
// CONSTRUYE UN NODO SIMPLE
//
async function createFileNode(path) {}

//
// CONSTRUYE UN NODO DE CARPETA
//
async function createDirectoryNode(path) {}

//
// OBTIENE LA LISTA DE ARCHIVOS QUE TIENE UN DIRECTORIO
//
async function readDirectory(path) {
  const items = await fs.readdir(path);
  return items;
}

//
// DECIDE QUE TIPO DE ARCHIVOS IGNORAR
//
const ignoredNames = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".env",
]);
function shouldIgnore(name) {
  return ignoredNames.has(name);
}

export async function detectTechnologies() {}

export async function findEntryPoints() {}

export async function filterNoise() {}
