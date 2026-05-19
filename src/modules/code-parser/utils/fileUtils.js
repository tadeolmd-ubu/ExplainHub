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
export function isParseable(filePath) {
  const type = getFileType(filePath);
  return (
    type === "javascript" ||
    type === "typescript" ||
    type === "markup" ||
    type === "stylesheet"
  );
}
export async function readFile(filePath) {
  return fs.readFile(filePath, "utf-8");
}
export function getFileType(filePath) {
  const ext = path.extname(filePath);
  return fileTypes[ext] || "unknown";
}
