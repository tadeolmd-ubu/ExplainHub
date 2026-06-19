export function buildMdEnhancer(markdown) {
  return `Eres un experto en documentación técnica. Mejora el siguiente markdown de documentación de un proyecto de software.

IMPORTANTE:
- NO inventes módulos, funciones, archivos o características que no aparezcan
- Preserva TODA la información técnica, tablas y datos existentes
- NO agregues "Título de:" ni ningún prefijo al título del proyecto. Preserva el título exactamente como está
- NO agregues secciones de recomendaciones, sugerencias, consejos o próximos pasos
- Si existe una sección de esquema de base de datos (Database Schema), presérvala completa con todas sus tablas, columnas y detalles
- Mejora la redacción, legibilidad y formato
- Mantén el formato markdown
- Responde en español

Markdown original:
${markdown}

Markdown mejorado:`;
}