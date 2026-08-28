import path from "node:path";
import { fileURLToPath } from "node:url";
import { getTreeSitterParser } from "./treeSitterFactory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SH_WASM = path.resolve(
  __dirname,
  "../../../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-bash.wasm",
);

const SOURCE_COMMANDS = new Set(["source", "."]);
const HTTP_COMMANDS = new Set(["curl", "wget", "http"]);
const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
]);

function stripQuotes(text) {
  return (text || "").replace(/^['"]|['"]$/g, "").trim();
}

function getCommandName(node) {
  const nameNode = node.childForFieldName("name");
  if (nameNode) return nameNode.text;
  const cmdNode = node.namedChildren.find((c) => c.type === "command_name");
  return cmdNode ? cmdNode.text : null;
}

function commandArgs(node) {
  const args = [];
  for (const child of node.namedChildren) {
    if (child.type === "command_name") continue;
    if (child.type === "concatenation") {
      args.push(child.text);
    } else if (child.type === "word" || child.type === "string") {
      args.push(child.text);
    }
  }
  return args.map(stripQuotes).filter(Boolean);
}

function extractHttpRoute(node, cmdName, routes) {
  const args = commandArgs(node);
  const line = node.startPosition.row + 1;

  if (cmdName === "http") {
    let method = "GET";
    let pathArg = args.find((a) => !a.startsWith("-"));
    if (pathArg && HTTP_METHODS.has(pathArg.toLowerCase())) {
      method = pathArg.toUpperCase();
      pathArg = args
        .slice(args.indexOf(pathArg) + 1)
        .find((a) => !a.startsWith("-"));
    }
    if (pathArg) {
      routes.push({ method, path: pathArg.replace(/[;,]$/, ""), line });
    }
    return;
  }

  let method = "GET";
  let pathArg = null;
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if ((token === "-X" || token === "--request") && i + 1 < args.length) {
      method = args[i + 1].toUpperCase();
      continue;
    }
    if (token.startsWith("-")) continue;
    if (token === method && /^[A-Z]+$/.test(token)) continue;
    if (!pathArg) pathArg = token;
  }

  if (pathArg) {
    routes.push({ method, path: pathArg.replace(/[;,]$/, ""), line });
  }
}

export async function parseSh(content) {
  const p = await getTreeSitterParser(SH_WASM);
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exportsList = [];

  function walk(node) {
    if (node.type === "comment") {
      return;
    }

    if (node.type === "function_definition") {
      const nameNode = node.namedChildren.find((c) => c.type === "word");
      const name = nameNode ? nameNode.text : null;
      if (name) {
        functions.push({
          name,
          kind: "function",
          params: [],
          line: node.startPosition.row + 1,
        });
        exportsList.push({
          name,
          kind: "function",
          line: node.startPosition.row + 1,
        });
      }
    }

    if (node.type === "command") {
      const cmdName = getCommandName(node);

      if (SOURCE_COMMANDS.has(cmdName)) {
        const target = node.namedChildren.find(
          (c) => c.type === "word" || c.type === "string",
        );
        if (target) {
          imports.push({
            source: stripQuotes(target.text),
            alias: null,
            line: node.startPosition.row + 1,
          });
        }
      } else if (cmdName === "alias") {
        const concat = node.namedChildren.find(
          (c) => c.type === "concatenation",
        );
        if (concat) {
          const nameWord = concat.namedChildren.find(
            (c) => c.type === "word",
          );
          const aliasName = nameWord
            ? nameWord.text.replace(/=$/, "")
            : null;
          if (aliasName) {
            exportsList.push({
              name: aliasName,
              kind: "alias",
              line: node.startPosition.row + 1,
            });
          }
        }
      } else if (HTTP_COMMANDS.has(cmdName)) {
        extractHttpRoute(node, cmdName, routes);
      }

      for (const child of node.namedChildren) walk(child);
    }

    if (node.type === "declaration_command") {
      for (const va of node.namedChildren) {
        if (va.type !== "variable_assignment") continue;
        const nameNode = va.namedChildren.find(
          (c) => c.type === "variable_name",
        );
        if (nameNode) {
          exportsList.push({
            name: nameNode.text,
            kind: "export",
            line: va.startPosition.row + 1,
          });
        }
      }
      return;
    }

    if (node.type === "variable_assignment") {
      const isTopLevel =
        node.parent?.type === "program" ||
        node.parent?.type === "redirected_statement";
      if (isTopLevel) {
        const nameNode = node.namedChildren.find(
          (c) => c.type === "variable_name",
        );
        if (nameNode) {
          exportsList.push({
            name: nameNode.text,
            kind: "variable",
            line: node.startPosition.row + 1,
          });
        }
      }
      return;
    }

    for (const child of node.namedChildren) walk(child);
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