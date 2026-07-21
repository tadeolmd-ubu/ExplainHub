import { Parser, Language } from "web-tree-sitter";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PS1_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-powershell.wasm",
);
const TS_WASM_DIR = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm",
);

let parser = null;

async function getParser() {
  if (parser) return parser;
  await Parser.init();
  const lang = await Language.load(PS1_WASM, {
    locateFile: (p) => path.join(TS_WASM_DIR, p),
  });
  parser = new Parser();
  parser.setLanguage(lang);
  return parser;
}

function getCommandName(node) {
  const commandNode = node.namedChildren.find(
    (c) => c.type === "command_name" || c.type === "command",
  );
  if (!commandNode) return null;
  if (commandNode.type === "command_name") return commandNode.text;
  const nameChild = commandNode.namedChildren.find(
    (c) => c.type === "command_name",
  );
  return nameChild?.text || commandNode.text;
}

function getCommandArgValue(node, argName) {
  const args = node.namedChildren.filter(
    (c) =>
      c.type === "command_argument" ||
      c.type === "statement" ||
      c.type === "variable",
  );
  for (const arg of args) {
    const text = arg.text;
    if (text.toLowerCase().startsWith(`-${argName.toLowerCase()}`)) {
      const value = text.slice(argName.length + 1).trim();
      return value || null;
    }
  }
  return null;
}

function extractStringFromArg(argNode) {
  if (!argNode) return null;
  const text = argNode.text;
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1);
  }
  if (text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1);
  }
  return text;
}

function extractParams(paramBlock) {
  const params = [];
  if (!paramBlock) return params;
  for (const child of paramBlock.namedChildren) {
    if (child.type === "parameter_declaration") {
      const nameNode = child.namedChildren.find(
        (c) => c.type === "variable" || c.type === "identifier",
      );
      const name = nameNode?.text?.replace(/^\$/, "") || "param";
      params.push(name);
    }
  }
  return params;
}

function isTopLevelFunction(node) {
  let current = node.parent;
  while (current) {
    if (
      current.type === "class_statement" ||
      current.type === "function_statement" ||
      current.type === "script_block"
    ) {
      if (current.type !== "script_block") return false;
    }
    current = current.parent;
  }
  return true;
}

function extractClassMethods(node) {
  const methods = [];
  for (const child of node.namedChildren) {
    if (child.type === "function_definition" || child.type === "function_statement") {
      const nameNode = child.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const paramBlock = child.namedChildren.find(
        (c) => c.type === "param_block",
      );
      const params = extractParams(paramBlock);
      methods.push({ name, params, line: child.startPosition.row + 1 });
    }
  }
  return methods;
}

export async function parsePs1(content) {
  const p = await getParser();
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exportsList = [];

  function walk(node) {
    if (node.type === "using_statement") {
      const moduleNode = node.namedChildren.find(
        (c) => c.type === "command_name" || c.type === "module",
      );
      const source = moduleNode?.text || null;
      if (source) {
        imports.push({
          source: source.replace(/^module\s+/, "").trim(),
          alias: null,
          line: node.startPosition.row + 1,
        });
      }
    }

    if (node.type === "command") {
      const cmdName = getCommandName(node);
      if (cmdName && cmdName.toLowerCase() === "import-module") {
        const argNode = node.namedChildren.find(
          (c) =>
            c.type === "command_argument" ||
            c.type === "statement" ||
            c.type === "variable",
        );
        const source = extractStringFromArg(argNode);
        if (source) {
          imports.push({
            source,
            alias: null,
            line: node.startPosition.row + 1,
          });
        }
      }
      if (cmdName && cmdName.toLowerCase() === "export-modulemember") {
        for (const child of node.namedChildren) {
          if (child.type === "command_argument") {
            const text = child.text;
            if (text.toLowerCase().startsWith("-function")) {
              const names = text
                .replace(/^-function\s*/i, "")
                .split(",")
                .map((n) => n.trim());
              for (const name of names) {
                if (name) {
                  exportsList.push({
                    name,
                    kind: "function",
                    line: node.startPosition.row + 1,
                  });
                }
              }
            }
          }
        }
      }
    }

    if (node.type === "class_statement") {
      const nameNode = node.childForFieldName("name");
      const name = nameNode?.text || "unknown";
      const baseClass = node.namedChildren.find(
        (c) => c.type === "base_class_expression",
      );
      let extends_ = null;
      if (baseClass) {
        const superName = baseClass.namedChildren.find(
          (c) => c.type === "type_identifier" || c.type === "identifier",
        );
        extends_ = superName?.text || baseClass.text || null;
      }
      const methods = extractClassMethods(node);
      classes.push({
        name,
        kind: "class",
        extends: extends_,
        methods,
        line: node.startPosition.row + 1,
      });
    }

    if (
      node.type === "function_definition" ||
      node.type === "function_statement"
    ) {
      if (isTopLevelFunction(node)) {
        const nameNode = node.childForFieldName("name");
        const name = nameNode?.text || "unknown";
        const paramBlock = node.namedChildren.find(
          (c) => c.type === "param_block",
        );
        const params = extractParams(paramBlock);
        functions.push({
          name,
          params,
          line: node.startPosition.row + 1,
        });
      }
    }

    for (const child of node.namedChildren) {
      walk(child);
    }
  }

  walk(root);

  return {
    imports,
    functions,
    classes,
    routes,
    exports: exportsList,
  };
}
