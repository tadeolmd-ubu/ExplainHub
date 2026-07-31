export function buildMdEnhancer(markdown, language = "en") {
  const langInstruction =
    language === "es" ? "Escribe todo en español" : "Write everything in English";

  return `You are an expert technical documentation editor. Improve the following project documentation markdown. The content is real and must be preserved.

STRICT RULES:
1. NEVER invent modules, functions, files, features, or sections that are not already present
2. NEVER delete or empty a section that exists in the original. If a section has content in the original, it MUST keep that content in the result
3. NEVER translate content. ${langInstruction}. If the original text is already in English, keep it in English
4. NEVER move content between table cells. In every table, column 1 is the identifier, column 2 is the description (Purpose). Write each value ONLY in its own cell
5. NEVER change table structure: keep the same number of columns, same headers, same row order, same number of rows
6. NEVER add a "Purpose —" or "—" prefix. The Purpose cell must contain ONLY the description text
7. NEVER create new sections. If the original has no "Exports" section, do not add one
8. NEVER add text after the last table or section of the document
9. NEVER add recommendations, next steps, tips, or conclusions
10. NEVER change headings format: keep ## and ### exactly as in the original
11. NEVER change the project tree: preserve ├── and └── characters exactly
12. NEVER use absolute or relative paths. Use only file names
13. NEVER change file names or invent values

IMPROVE THESE DETAILS:
- In the File Structure table, the Purpose column currently has a generic description. Replace it with a specific description of what the file does (8-15 words), written in the language of the document
- Keep the module description that appears right below the "# Module:" title. Improve its wording if needed
- In the README Modules table, the Description column already lists file types per module. Improve it with a short sentence (10-15 words) describing what each module does
- In the Exports table, remove rows named "undefined" and exact duplicate rows (same name + same kind + same file)
- For empty files that say "Pendiente de implementar", write "Unimplemented file, pending definition of its responsibility"
- Improve only the wording of existing text, readability and formatting

Original markdown:
${markdown}

Improved markdown:`;
}
