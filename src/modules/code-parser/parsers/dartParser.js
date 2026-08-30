import path from "node:path";
import { fileURLToPath } from "node:url";
import { getTreeSitterParser } from "./treeSitterFactory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DART_WASM = path.resolve(__dirname, "../wasm/tree-sitter-dart.wasm");

function extractName(node) {
  const id = node.childForFieldName("name");
  if (id) return id.text;
  const first = node.namedChildren.find((c) => c.type === "identifier");
  return first ? first.text : null;
}

function extractTypeParams(node) {
  const tp = node.namedChildren.find((c) => c.type === "type_parameters");
  if (!tp) return null;
  const params = tp.namedChildren
    .filter((c) => c.type === "type_parameter")
    .map((c) => c.text);
  return params.length ? `<${params.join(", ")}>` : null;
}

function extractExtends(node) {
  const sc = node.namedChildren.find((c) => c.type === "superclass");
  if (sc) {
    const typeIds = sc.namedChildren.filter(
      (c) => c.type === "type_identifier" || c.type === "type_arguments",
    );
    if (typeIds.length) {
      return typeIds.map((c) => c.text).join("");
    }

    const mixins = sc.namedChildren.find((c) => c.type === "mixins");
    if (mixins) {
      const mixinTypes = mixins.namedChildren
        .filter((c) => c.type === "type_identifier")
        .map((c) => c.text);
      if (mixinTypes.length) return mixinTypes.join(", ");
    }
  }

  const ifaces = node.namedChildren.find((c) => c.type === "interfaces");
  if (ifaces) {
    const types = ifaces.namedChildren
      .filter((c) => c.type === "type_identifier")
      .map((c) => c.text);
    if (types.length) return types.join(", ");
  }

  return null;
}

function extractParams(funcSig) {
  const paramList = funcSig.namedChildren.find(
    (c) => c.type === "formal_parameter_list",
  );
  if (!paramList) return [];

  const params = [];
  function walkParams(node) {
    if (node.type === "formal_parameter") {
      const nameNode = node.namedChildren.find(
        (c) =>
          c.type === "identifier" ||
          c.type === "super_formal_parameter" ||
          c.type === "constructor_param",
      );
      if (nameNode) {
        let paramName = nameNode.text;
        if (paramName.startsWith("this.")) paramName = paramName.slice(5);
        if (paramName.startsWith("super.")) paramName = paramName.slice(6);
        params.push(paramName);
      }
      return;
    }
    for (const child of node.namedChildren || []) {
      walkParams(child);
    }
  }
  walkParams(paramList);
  return params;
}

function extractReturnType(funcSig) {
  for (const child of funcSig.namedChildren) {
    if (child.type === "void_type") return "void";
    if (
      child.type === "type_identifier" ||
      child.type === "function_type"
    ) {
      return child.text;
    }
  }
  return null;
}

function extractClassKind(node) {
  if (node.type === "mixin_declaration") return "mixin";
  if (node.type === "enum_declaration") return "enum";
  if (node.type === "extension_declaration") return "extension";
  if (node.type === "class_definition") {
    if (node.namedChildren.some((c) => c.type === "abstract")) {
      return "abstract class";
    }
    return "class";
  }
  return "class";
}

function extractExtensionOnType(node) {
  if (node.type === "mixin_declaration") {
    const hasTypeParams = node.namedChildren.some(
      (c) => c.type === "type_parameters",
    );
    const startIdx = hasTypeParams
      ? node.namedChildren.findIndex((c) => c.type === "type_parameters") + 1
      : 1;
    const onType = node.namedChildren[startIdx];
    if (onType && onType.type === "type_identifier") {
      const typeArgs = node.namedChildren[startIdx + 1];
      if (typeArgs && typeArgs.type === "type_arguments") {
        return onType.text + typeArgs.text;
      }
      return onType.text;
    }
    return null;
  }

  if (node.type !== "extension_declaration") return null;
  const onNode = node.namedChildren.find((c) => c.type === "on");
  if (onNode) {
    const idx = node.namedChildren.indexOf(onNode);
    const next = node.namedChildren[idx + 1];
    return next ? next.text : null;
  }
  const typeNode = node.namedChildren.find((c) => c.type === "type_identifier");
  return typeNode ? typeNode.text : null;
}

function extractClassBody(node) {
  if (node.type === "extension_declaration") {
    return node.namedChildren.find((c) => c.type === "extension_body");
  }
  return node.namedChildren.find((c) => c.type === "class_body");
}

function extractMethodFromDecl(child, pendingAnnotation) {
  const fcsig = child.namedChildren.find((c) => c.type === "function_signature");
  if (fcsig) {
    const nameNode = fcsig.namedChildren.find((c) => c.type === "identifier");
    const name = nameNode ? nameNode.text : null;
    if (name) {
      return {
        name,
        kind: "method",
        params: extractParams(fcsig),
        returnType: extractReturnType(fcsig),
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      };
    }
  }

  const ccsig = child.namedChildren.find(
    (c) => c.type === "constant_constructor_signature",
  );
  if (ccsig) {
    const qualified = ccsig.namedChildren.find((c) => c.type === "qualified");
    const fname = qualified?.namedChildren.find((c) => c.type === "identifier");
    if (fname) {
      return {
        name: fname.text,
        kind: "constructor",
        params: extractParams(ccsig),
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      };
    }
  }

  const csig = child.namedChildren.find(
    (c) => c.type === "constructor_signature",
  );
  if (csig) {
    const fname = csig.namedChildren.find((c) => c.type === "identifier");
    if (fname) {
      return {
        name: fname.text,
        kind: "constructor",
        params: extractParams(csig),
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      };
    }
  }

  const fcsig2 = child.namedChildren.find(
    (c) => c.type === "factory_constructor_signature",
  );
  if (fcsig2) {
    const fname = fcsig2.namedChildren.find((c) => c.type === "identifier");
    if (fname) {
      return {
        name: fname.text,
        kind: "factory constructor",
        params: extractParams(fcsig2),
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      };
    }
  }

  if (
    child.namedChildren.some((c) => c.type === "getter_signature")
  ) {
    const gs = child.namedChildren.find((c) => c.type === "getter_signature");
    const gname = gs?.namedChildren.find((c) => c.type === "identifier");
    if (gname) {
      return {
        name: gname.text,
        kind: "getter",
        params: [],
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      };
    }
  }

  if (
    child.namedChildren.some((c) => c.type === "setter_signature")
  ) {
    const ss = child.namedChildren.find((c) => c.type === "setter_signature");
    const sname = ss?.namedChildren.find((c) => c.type === "identifier");
    if (sname) {
      return {
        name: sname.text,
        kind: "setter",
        params: [],
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      };
    }
  }

  return null;
}

function extractMethods(classBody) {
  const methods = [];
  if (!classBody) return methods;

  let pendingAnnotation = null;

  for (const child of classBody.namedChildren) {
    if (child.type === "marker_annotation" || child.type === "annotation") {
      pendingAnnotation = child.text;
      continue;
    }

    if (child.type === "method_signature") {
      const fsig = child.namedChildren.find(
        (c) => c.type === "function_signature",
      );
      if (!fsig) continue;
      const nameNode = fsig.namedChildren.find((c) => c.type === "identifier");
      const name = nameNode ? nameNode.text : null;
      if (!name) continue;

      methods.push({
        name,
        kind: "method",
        params: extractParams(fsig),
        returnType: extractReturnType(fsig),
        annotation: pendingAnnotation,
        line: child.startPosition.row + 1,
      });
      pendingAnnotation = null;
      continue;
    }

    if (child.type === "getter_signature") {
      const nameNode = child.namedChildren.find(
        (c) => c.type === "identifier",
      );
      if (nameNode) {
        methods.push({
          name: nameNode.text,
          kind: "getter",
          params: [],
          annotation: pendingAnnotation,
          line: child.startPosition.row + 1,
        });
      }
      pendingAnnotation = null;
      continue;
    }

    if (child.type === "setter_signature") {
      const nameNode = child.namedChildren.find(
        (c) => c.type === "identifier",
      );
      if (nameNode) {
        methods.push({
          name: nameNode.text,
          kind: "setter",
          params: [],
          annotation: pendingAnnotation,
          line: child.startPosition.row + 1,
        });
      }
      pendingAnnotation = null;
      continue;
    }

    if (child.type === "declaration") {
      const method = extractMethodFromDecl(child, pendingAnnotation);
      if (method) {
        methods.push(method);
      }
      pendingAnnotation = null;
      continue;
    }

    pendingAnnotation = null;
  }

  return methods;
}

export async function parseDart(content) {
  const p = await getTreeSitterParser(DART_WASM);
  const tree = p.parse(content);
  const root = tree.rootNode;

  const imports = [];
  const functions = [];
  const classes = [];
  const routes = [];
  const exportsList = [];

  function walk(node, parentClass) {
    if (node.type === "import_or_export") {
      const libImport = node.namedChildren.find(
        (c) => c.type === "library_import",
      );
      const libExport = node.namedChildren.find(
        (c) => c.type === "library_export",
      );

      if (libImport) {
        const spec = libImport.namedChildren.find(
          (c) => c.type === "import_specification",
        );
        if (spec) {
          const uri = spec.namedChildren.find(
            (c) => c.type === "configurable_uri",
          );
          const uriText = uri
            ? uri.text.replace(/^['"]|['"]$/g, "")
            : spec.text.replace(/^import\s+/, "").replace(/;\s*$/, "").trim();
          imports.push({
            source: uriText,
            alias: null,
            line: node.startPosition.row + 1,
          });
        }
      }

      if (libExport) {
        const uri = libExport.namedChildren.find(
          (c) => c.type === "configurable_uri",
        );
        if (uri) {
          exportsList.push({
            name: uri.text.replace(/^['"]|['"]$/g, ""),
            kind: "export",
            line: node.startPosition.row + 1,
          });
        }
      }
      return;
    }

    if (
      node.type === "class_definition" ||
      node.type === "mixin_declaration" ||
      node.type === "enum_declaration" ||
      node.type === "extension_declaration"
    ) {
      const isInsideClass =
        parentClass &&
        (node.parent?.type === "class_body" ||
          node.parent?.type === "extension_body");
      if (isInsideClass) return;

      const name = extractName(node);
      if (!name) return;

      const kind = extractClassKind(node);
      const typeParams = extractTypeParams(node);
      const extendsType = extractExtends(node);
      const onType = extractExtensionOnType(node);
      const classBody = extractClassBody(node);
      const methods = extractMethods(classBody);

      const fullName = typeParams ? `${name}${typeParams}` : name;

      classes.push({
        name: fullName,
        kind,
        extends: extendsType || onType,
        methods,
        line: node.startPosition.row + 1,
      });

      exportsList.push({
        name: fullName,
        kind,
        line: node.startPosition.row + 1,
      });
      return;
    }

    if (node.type === "type_alias") {
      const nameNode = node.namedChildren.find(
        (c) => c.type === "type_identifier",
      );
      if (nameNode) {
        exportsList.push({
          name: nameNode.text,
          kind: "typedef",
          line: node.startPosition.row + 1,
        });
      }
      return;
    }

    if (node.type === "function_signature" && !parentClass) {
      const nameNode = node.namedChildren.find((c) => c.type === "identifier");
      const name = nameNode ? nameNode.text : null;
      if (!name) return;

      functions.push({
        name,
        kind: "function",
        params: extractParams(node),
        returnType: extractReturnType(node),
        line: node.startPosition.row + 1,
      });

      exportsList.push({
        name,
        kind: "function",
        line: node.startPosition.row + 1,
      });
      return;
    }

    if (
      node.type === "const_builtin" ||
      node.type === "final_builtin" ||
      node.type === "static_final_declaration_list"
    ) {
      return;
    }

    if (node.type === "declaration" && !parentClass) {
      const fcsig = node.namedChildren.find(
        (c) => c.type === "function_signature",
      );
      if (fcsig) {
        const nameNode = fcsig.namedChildren.find(
          (c) => c.type === "identifier",
        );
        const name = nameNode ? nameNode.text : null;
        if (name) {
          functions.push({
            name,
            kind: "function",
            params: extractParams(fcsig),
            returnType: extractReturnType(fcsig),
            line: node.startPosition.row + 1,
          });
          exportsList.push({
            name,
            kind: "function",
            line: node.startPosition.row + 1,
          });
        }
      }
      return;
    }

    for (const child of node.namedChildren) {
      walk(child, parentClass);
    }
  }

  for (const child of root.namedChildren) {
    walk(child, null);
  }

  return {
    imports,
    functions,
    classes,
    routes,
    exports: exportsList,
  };
}
