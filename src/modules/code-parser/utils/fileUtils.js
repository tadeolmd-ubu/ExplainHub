import fs from "node:fs/promises";
import path from "node:path";
import { fileTypes } from "../fileTypes.js";

export function traverse(node, parentPath = "") {
  const files = [];
  if (node.type === "file") {
    files.push(parentPath ? `${parentPath}/${node.name}` : node.name);
  }
  if (node.type === "directory" && node.children) {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    for (const child of node.children) {
      const childFiles = traverse(child, currentPath);
      for (const file of childFiles) {
        files.push(file);
      }
    }
  }
  return files;
}

const parseableTypes = new Set([
  "javascript",
  "typescript",
  "markup",
  "stylesheet",
  "sql",
  "python",
  "php",
  "csharp",
  "sln",
  "csproj",
  "config",
  "xaml",
  "rust",
  "java",
  "go",
  "c",
  "cpp",
  "cargotoml",
  "cargolock",
  "rusttoolchain",
  "cargoconfig",
  "ruby",
]);
const parseableTypesOverride = new Map([
  ["Cargo.toml", "cargotoml"],
  ["Cargo.lock", "cargolock"],
  ["rust-toolchain.toml", "rusttoolchain"],
  [".cargo/config.toml", "cargoconfig"],
]);
export function isParseable(filePath) {
  const type = getFileType(filePath);
  return parseableTypes.has(type);
}
export async function readFile(filePath) {
  return fs.readFile(filePath, "utf-8");
}
export function getFileType(filePath) {
  const basename = path.basename(filePath);
  if (parseableTypesOverride.has(basename)) {
    return parseableTypesOverride.get(basename);
  }

  if (basename === "config.toml" && path.basename(path.dirname(filePath)) === ".cargo") {
    return "cargoconfig";
  }

  const ext = path.extname(filePath);
  return fileTypes[ext] || "unknown";
}

export function saveFile(content, filePath) {
  return fs.writeFile(filePath, content, "utf-8");
}
