import { execFile } from "node:child_process";

const EXTRACTION_SCRIPT = `
import ast, json, sys

def parse_one(code):
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return {"imports": [], "functions": [], "classes": [], "routes": [], "exports": []}

    imports = []
    functions = []
    classes = []
    routes = []
    exports = []

    def strip_quotes(s):
        if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
            return s[1:-1]
        return s

    def parse_func(node):
        return {
            "name": node.name,
            "kind": "async" if isinstance(node, ast.AsyncFunctionDef) else "function",
            "params": [arg.arg for arg in node.args.args],
            "line": node.lineno
        }

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({
                    "type": "import",
                    "source": alias.name,
                    "alias": alias.asname,
                    "line": node.lineno
                })
        elif isinstance(node, ast.ImportFrom):
            specifiers = [{"name": n.name, "alias": n.asname} for n in node.names]
            imports.append({
                "type": "from",
                "source": node.module,
                "specifiers": specifiers,
                "line": node.lineno
            })

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append(parse_func(node))
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and hasattr(dec.func, "attr"):
                    path = strip_quotes(ast.unparse(dec.args[0])) if dec.args else "/"
                    routes.append({
                        "method": dec.func.attr.upper(),
                        "path": path,
                        "line": node.lineno
                    })

        elif isinstance(node, ast.ClassDef):
            bases = [ast.unparse(b) for b in node.bases]
            methods = []
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    methods.append(parse_func(item))
                    for dec in item.decorator_list:
                        if isinstance(dec, ast.Call) and hasattr(dec.func, "attr"):
                            path = strip_quotes(ast.unparse(dec.args[0])) if dec.args else "/"
                            routes.append({
                                "method": dec.func.attr.upper(),
                                "path": path,
                                "line": item.lineno
                            })
            classes.append({
                "name": node.name,
                "extends": bases[0] if bases else None,
                "methods": methods,
                "line": node.lineno
            })

        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if target.id == "__all__":
                        exports.append({
                            "name": "__all__",
                            "kind": "module",
                            "line": node.lineno
                        })
                    if target.id == "urlpatterns" and isinstance(node.value, ast.List):
                        for item in node.value.elts:
                            if isinstance(item, ast.Call):
                                func_name = ast.unparse(item.func)
                                if func_name in ("path", "re_path"):
                                    path = strip_quotes(ast.unparse(item.args[0])) if item.args else ""
                                    routes.append({
                                        "method": "ANY",
                                        "path": path,
                                        "line": item.lineno
                                    })

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            if not node.name.startswith("_"):
                exports.append({
                    "name": node.name,
                    "kind": "module",
                    "line": node.lineno
                })
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and not target.id.startswith("_"):
                    exports.append({
                        "name": target.id,
                        "kind": "module",
                        "line": node.lineno
                    })

    return {
        "imports": imports,
        "functions": functions,
        "classes": classes,
        "routes": routes,
        "exports": exports
    }

files = json.loads(sys.stdin.read())
results = [parse_one(f["content"]) for f in files]
print(json.dumps(results))
`;

function execPython(input) {
  return new Promise((resolve) => {
    const child = execFile("python3", ["-c", EXTRACTION_SCRIPT], {
      maxBuffer: 10 * 1024 * 1024,
    }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve([]);
      }
    });
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

export async function parsePython(content) {
  const results = await execPython([{ content }]);
  return results[0] || { imports: [], functions: [], classes: [], routes: [], exports: [] };
}

export async function parsePythonBatch(files) {
  return execPython(files);
}
