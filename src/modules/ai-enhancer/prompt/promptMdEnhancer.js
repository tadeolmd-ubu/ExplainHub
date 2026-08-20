export function buildMdEnhancer(markdown, language = "en") {
  const langInstruction =
    language === "es" ? "Escribe todo en español" : "Write everything in English";

  return `You are an expert technical documentation writer. Improve the following project documentation markdown. The content is real and must be preserved. All the technical data (files, functions, routes, technologies, dependencies) is already present in the document — use it to write rich, contextual explanations.

STRICT RULES:
1. NEVER invent modules, functions, files, features, or sections that are not already present in the document
2. NEVER delete or empty a section that exists in the original. If a section has content, it MUST keep that content
3. NEVER move content between table cells. Column 1 is the identifier, column 2 is the description. Write each value ONLY in its own cell
4. NEVER change table structure: keep the same number of columns, same headers, same row order, same number of rows
5. NEVER create new sections that don't exist in the original
6. NEVER change headings format: keep ## and ### exactly as in the original
7. NEVER change the project tree: preserve ├── and └── characters exactly
8. NEVER use absolute or relative paths. Use only file names
9. NEVER change file names or invent values
10. NEVER add recommendations, next steps, tips, or conclusions

WHAT TO IMPROVE:

A) OVERVIEW (if this is the README):
- Right after the project title, add a short paragraph (2-4 sentences) explaining what this project IS and what it DOES, based on the technologies, entry points, routes, and file structure visible in the document
- Explain HOW the stack works together (e.g. "Express handles HTTP requests, Prisma manages database access via PostgreSQL, and the frontend is served as static HTML")

B) MODULE DESCRIPTIONS:
- In the Modules table (README), replace generic file-type descriptions with a sentence explaining what each module DOES in the system and how it relates to others
- In each module file (below the "# Module:" title), improve the description to explain the module's ROLE in the architecture, not just what language it uses

C) ENDPOINTS / API:
- For each route in the API Endpoints table, if there is enough information (method, path, associated functions), add a brief explanation of what the endpoint does, what parameters it expects, and what it returns

D) FILE PURPOSE TABLE:
- In the File Structure table, the Purpose column must describe what each file specifically DOES (8-15 words), based on its name, exported functions, imports, and routes

E) EXPORTS TABLE:
- Remove rows named "undefined" and exact duplicate rows (same name + same kind + same file)

F) EMPTY FILES:
- For files that say "Pendiente de implementar", write "Unimplemented file, pending definition of its responsibility"

G) WORDING:
- Improve readability and clarity of all existing text
- Make descriptions specific and concrete, not generic

Original markdown:
${markdown}

Improved markdown:`;
}
