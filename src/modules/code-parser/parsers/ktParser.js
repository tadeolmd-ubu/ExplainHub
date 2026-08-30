import path from "node:path";
import { fileURLToPath } from "node:url";
import { getTreeSitterParser } from "./treeSitterFactory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KOTLIN_WASM = path.resolve(__dirname, "../wasm/tree-sitter-kotlin.wasm");

export async function parseKotlin(content) {
  const parser = await getTreeSitterParser(KOTLIN_WASM);
  const tree = parser.parse(content);

  const imports = [];
  const classes = [];
  const functions = [];
  const exports = [];
  const properties = [];

  function walk(node) {
    if (!node) return;

    if (node.type === "import_header") {
      const identifier = node.children.find((c) => c.type === "identifier");
      if (identifier) {
        imports.push({
          source: identifier.text,
          alias: null,
          line: node.startPosition.row + 1,
        });
      }
    }

    if (node.type === "class_declaration") {
      const isInsideClass =
        node.parent?.type === "class_body" ||
        node.parent?.type === "enum_class_body";
      if (isInsideClass) return;

      const name = extractName(node);
      if (!name) return;

      const modifiers = extractModifiers(node);
      const hasEnumKeyword = node.children.some((c) => c.type === "enum");
      const kind = hasEnumKeyword
        ? "enum class"
        : modifiers.includes("data")
          ? "data class"
          : modifiers.includes("annotation")
            ? "annotation class"
            : modifiers.includes("sealed")
              ? "sealed class"
              : modifiers.includes("abstract")
                ? "abstract class"
                : "class";

      const superclasses = extractSuperclass(node);
      const methods = extractMethods(node);

      classes.push({
        name,
        kind,
        extends: superclasses,
        methods,
        line: node.startPosition.row + 1,
      });

      exports.push({
        name,
        kind,
        line: node.startPosition.row + 1,
      });
    }

    if (node.type === "object_declaration") {
      const name = extractName(node);
      if (!name) return;

      const methods = extractMethods(node);

      classes.push({
        name,
        kind: "object",
        extends: null,
        methods,
        line: node.startPosition.row + 1,
      });

      exports.push({
        name,
        kind: "object",
        line: node.startPosition.row + 1,
      });
    }

    if (node.type === "function_declaration") {
      const name = extractFunctionName(node);
      if (!name) return;

      const isInsideClass =
        node.parent?.type === "class_body" ||
        node.parent?.type === "enum_class_body";
      if (isInsideClass) return;

      const modifiers = extractModifiers(node);
      const params = extractParams(node);
      const async = modifiers.includes("suspend");

      functions.push({
        name,
        kind: "function",
        params,
        async,
        line: node.startPosition.row + 1,
      });

      exports.push({
        name,
        kind: "function",
        line: node.startPosition.row + 1,
      });
    }

    if (node.type === "property_declaration") {
      const name = extractPropertyName(node);
      if (!name) return;

      const modifiers = extractModifiers(node);
      const kind = modifiers.includes("const")
        ? "const"
        : node.children.some((c) => c.type === "var" || c.text === "var")
          ? "var"
          : "val";

      properties.push({
        name,
        kind,
        line: node.startPosition.row + 1,
      });

      if (modifiers.includes("const") || kind === "const") {
        exports.push({
          name,
          kind: "const",
          line: node.startPosition.row + 1,
        });
      }
    }

    if (node.type === "type_alias") {
      const name = node.children.find((c) => c.type === "type_identifier");
      if (name) {
        exports.push({
          name: name.text,
          kind: "typealias",
          line: node.startPosition.row + 1,
        });
      }
    }

    for (const child of node.children || []) {
      walk(child);
    }
  }

  walk(tree.rootNode);

  return { imports, exports, classes, functions, routes: [] };
}

function extractName(node) {
  const typeIdentifier = node.children.find(
    (c) => c.type === "type_identifier",
  );
  return typeIdentifier ? typeIdentifier.text : null;
}

function extractModifiers(node) {
  const modifiers = node.children.find((c) => c.type === "modifiers");
  if (!modifiers) return [];
  return modifiers.children.map((c) => c.text.trim()).filter(Boolean);
}

function extractSuperclass(node) {
  for (const child of node.children || []) {
    if (child.type === "delegation_specifier") {
      const userType = child.children.find((c) => c.type === "user_type");
      if (userType) {
        const typeIdentifier = userType.children.find(
          (c) => c.type === "type_identifier",
        );
        return typeIdentifier ? typeIdentifier.text : null;
      }
      const constructorInvocation = child.children.find(
        (c) => c.type === "constructor_invocation",
      );
      if (constructorInvocation) {
        const userType2 = constructorInvocation.children.find(
          (c) => c.type === "user_type",
        );
        if (userType2) {
          const typeIdentifier2 = userType2.children.find(
            (c) => c.type === "type_identifier",
          );
          return typeIdentifier2 ? typeIdentifier2.text : null;
        }
      }
    }
  }
  return null;
}

function extractMethods(node) {
  const body =
    node.children.find((c) => c.type === "class_body" || c.type === "enum_class_body") ||
    node;
  const methods = [];

  function walkClassBody(n) {
    if (n.type === "function_declaration") {
      const name = extractFunctionName(n);
      if (name) {
        const params = extractParams(n);
        const modifiers = extractModifiers(n);
        methods.push({
          name,
          kind: "method",
          params,
          async: modifiers.includes("suspend"),
          line: n.startPosition.row + 1,
        });
      }
    }
    if (n.type === "class_declaration") {
      return;
    }
    for (const child of n.children || []) {
      walkClassBody(child);
    }
  }

  walkClassBody(body);
  return methods;
}

function extractFunctionName(node) {
  const simpleId = node.children.find((c) => c.type === "simple_identifier");
  return simpleId ? simpleId.text : null;
}

function extractParams(node) {
  const paramsList = node.children.find(
    (c) => c.type === "function_value_parameters",
  );
  if (!paramsList) return [];

  const params = [];
  for (const child of paramsList.children || []) {
    if (child.type === "parameter") {
      const param = child.children.find((c) => c.type === "simple_identifier");
      if (param) params.push(param.text);
    }
  }
  return params;
}

function extractPropertyName(node) {
  const varDecl = node.children.find((c) => c.type === "variable_declaration");
  if (varDecl) {
    const simpleId = varDecl.children.find((c) => c.type === "simple_identifier");
    return simpleId ? simpleId.text : null;
  }
  return null;
}
