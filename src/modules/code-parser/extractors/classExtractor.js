import { extractFunctions } from "./functionExtractor.js";

export function extractClasses(ast) {
  const classes = [];

  try {
    const visit = (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "ClassDeclaration") {
        classes.push({
          name: node.id?.name || "Anonymous",
          extends: node.superClass?.name,
          line: node.loc?.start.line || 0,
          methods: extractFunctions(node),
        });
      }
      for (const key in node) {
        if (key === "loc" || key === "range" || key === "comments") continue;
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            visit(item);
          }
        } else if (typeof child === "object") {
          visit(child);
        }
      }
    };
    visit(ast);
    return classes;
  } catch (error) {
    console.error("Error extracting classes:", error);
    return [];
  }
}
