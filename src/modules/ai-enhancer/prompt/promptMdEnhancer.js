export function buildMdEnhancer(markdown, language = "en") {
  const langInstruction =
    language === "es" ? "Escribe todo en español" : "Write everything in English";

  return `You are an expert technical documentation editor. Improve the following project documentation markdown. The content is real and must be preserved.

STRICT RULES:
1. NEVER invent modules, functions, files, features, or sections that are not already present in the document
2. NEVER delete or empty a section that exists in the original. If a section has content, it MUST keep that content
3. NEVER move content between table cells. Column 1 is the identifier, column 2 is the description. Write each value ONLY in its own cell
4. NEVER change table structure: keep the same number of columns, same headers, same row order, same number of rows
5. NEVER create duplicate sections. If the original has one "## File Structure" and one "## Exports", keep exactly one of each
6. NEVER add files to the File Structure table that are not in the original
7. NEVER add exports to the Exports table that are not in the original
8. NEVER add new sections that don't exist in the original
9. NEVER change headings format: keep ## and ### exactly as in the original
10. NEVER change the project tree: preserve ├── and └── characters exactly
11. NEVER use absolute or relative paths. Use only file names
12. NEVER change file names or invent values
13. NEVER add recommendations, next steps, tips, or conclusions
14. NEVER change the order of sections from the original

WHAT TO IMPROVE:
- In the File Structure table, improve ONLY the Purpose column text (8-15 words per file). Do NOT add or remove rows
- Keep the module description below the "# Module:" title. Improve its wording if needed. Do NOT add new descriptions
- In the README Modules table, improve ONLY the Description column text. Do NOT add or remove rows
- In the Exports table, remove rows named "undefined" and exact duplicate rows (same name + same kind + same file)
- For empty files that say "Pendiente de implementar", write "Unimplemented file, pending definition of its responsibility"
- Improve readability and clarity of existing text only

Original markdown:
${markdown}

Improved markdown:`;
}
