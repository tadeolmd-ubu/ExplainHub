export function routinesFormatter(files) {
  const lines = ["ROUTINES", "========"];
  let hasData = false;
  for (const file of files) {
    const block = fmtRoutines(file);
    if (!block) continue;
    hasData = true;
    lines.push("", block);
  }
  if (!hasData) lines.push("\n  (none)");
  return lines.join("\n");
}

function fmtRoutines(file) {
  const funcs = file.functions || [];
  const procs = file.storedProcedures || [];
  if (!funcs.length && !procs.length) return null;

  const parts = [];

  if (funcs.length) {
    parts.push(
      ...funcs.map((fn) => {
        const params = fn.params.map((p) => `${p.mode} ${p.name} ${p.type}`).join(", ");
        return `FUNCTION ${fn.name}(${params}) ${fn.returnType ? `→ ${fn.returnType}` : ""}`;
      }),
    );
  }

  if (procs.length) {
    parts.push(
      ...procs.map((p) => {
        const params = p.params.map((pm) => `${pm.mode} ${pm.name} ${pm.type}`).join(", ");
        return `PROCEDURE ${p.name}(${params})`;
      }),
    );
  }

  return `${file.filePath}\n  ${parts.join("\n  ")}`;
}
