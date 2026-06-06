export function buildMdEnhancer(markdown) {
  return `Eres un experto en documentación técnica. Mejora el siguiente markdown de documentación de un proyecto de software.

IMPORTANTE:
- NO inventes módulos, funciones, archivos o características que no aparezcan
- Preserva TODA la información técnica, tablas y datos existentes
- Mejora la redacción, legibilidad y formato
- Agrega contexto descriptivo donde sea posible sin inventar
- Mantén el formato markdown
- Responde en español

Markdown original:
${markdown}

Markdown mejorado:`;
}