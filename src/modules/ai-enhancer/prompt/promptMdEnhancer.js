export function buildMdEnhancer(markdown, language = "en") {
  const langInstruction =
    language === "es" ? "Responde en español" : "Respond in English";

  return `Eres un experto en documentación técnica. Mejora el siguiente markdown de documentación de un proyecto de software.

REGLAS ESTRICTAS:
- NO inventes módulos, funciones, archivos o características que no aparezcan
- Preserva TODA la información técnica, tablas y datos existentes
- NO agregues "Título de:" ni ningún prefijo al título del proyecto. Preserva el título exactamente como está
- NO agregues secciones de recomendaciones, sugerencias, consejos o próximos pasos
- NO agregues definiciones, descripciones ni explicaciones de las tecnologías. Solo mencionalas por nombre
- NO expliques para qué sirve cada tecnología. El lector ya las conoce
- NO reestructures tablas: preserva el mismo número de columnas, los mismos encabezados y el mismo orden de filas
- NO agregues columnas ni filas extra a tablas existentes
- NO agregues texto descriptivo sobre el proyecto como "Este proyecto utiliza..." o "El proyecto está construido con..."
- Si existe una sección de esquema de base de datos (Database Schema), presérvala completa con todas sus tablas, columnas y detalles
- Solo mejora la redacción del texto que ya existe, legibilidad y formato
- Mantén el formato markdown
- ${langInstruction}

Markdown original:
${markdown}

Markdown mejorado:`;
}
