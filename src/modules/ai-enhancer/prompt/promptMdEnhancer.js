export function buildMdEnhancer(markdown, language = "en") {
  const langInstruction =
    language === "es" ? "Escribe todo en español" : "Write everything in English";

  return `You are an expert technical documentation editor. Improve the following project documentation markdown. The content is real and must be preserved.

STRICT RULES — NEVER DO THESE:
1. NEVER invent modules, functions, files, features, or sections that are not already present in the document
2. NEVER delete or empty a section that exists in the original. If a section has content, it MUST keep that content
3. NEVER move content between table cells. Each cell is independent
4. NEVER add empty rows or separator-only rows to tables
5. NEVER create duplicate sections. If the original has one "## File Structure" and one "## Exports", keep exactly one of each
6. NEVER add files to the File Structure table that are not in the original
7. NEVER add exports to the Exports table that are not in the original
8. NEVER add new sections that don't exist in the original
9. NEVER change headings format: keep ## and ### exactly as in the original
10. NEVER change the project tree: preserve ├── and └── characters exactly
11. NEVER use absolute or relative paths. Use only file names
12. NEVER change file names or invent values in tables
13. NEVER add recommendations, next steps, tips, or conclusions
14. NEVER change the order of sections from the original

WHAT YOU MUST DO:

A) README — Add a project description (2-3 sentences) directly after the "# Title" heading, before the first ## section. Infer from technologies, file structure, routes, and modules. Explain what the project does, its stack, and architecture.

B) Module docs — After the "# Module:" heading, ADD a 1-2 sentence description of what the module does. If there is already a description, improve it. If there is only the heading with no description, write one. Infer from the module's files, functions, routes, and exports. Be specific about functionality, not just file types.

C) File Structure table — Improve ONLY the Purpose column text (8-15 words per file). Do NOT add or remove rows. Do NOT change file names.

D) Functions table — If there is no "Description" column, ADD one as the LAST column. Keep existing columns (Name, Kind, Async, File) unchanged. Write a brief description of what each function does based on its name, parameters, and context. One short sentence per function.

E) Routes table — The table must have columns: Method, Path, File, Params (in that order). If "Params" column is missing, ADD it as the last column. List ONLY the actual parameters from the function signature (e.g., "email, password"). Do NOT invent parameters like "token" or "data".

F) README Modules table — Improve ONLY the Description column text. Do NOT add or remove rows.

G) Exports table — Keep columns: Name, Kind, File. Do NOT add extra columns. Remove rows named "undefined" and exact duplicate rows.

H) For empty files that say "Pendiente de implementar", write "Unimplemented file, pending definition of its responsibility".

Original markdown:
${markdown}

Improved markdown:`;
}
