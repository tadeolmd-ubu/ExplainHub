export function buildPrompt(plainText) {
  return `IMPORTANTE: Responde ÚNICAMENTE en español.
IMPORTANTE: Usa SOLO texto plano. NADA de markdown, ni ##, ni **, ni ---, ni tablas markdown.
Usa ==== para títulos principales, ---- para separadores, y tablas con +---+---+.
Eres un experto en análisis de código. A partir del siguiente análisis técnico, genera un informe completo con estos apartados:
1. VISIÓN GENERAL - Qué hace el proyecto, tecnologías principales, tipo de arquitectura
2. MÓDULOS Y COMPONENTES - Por cada módulo: su responsabilidad y cómo se relaciona con los demás
3. API / RUTAS - Endpoints disponibles (si aplica)
4. DEPENDENCIAS EXTERNAS - Librerías clave que usa el proyecto
5. NÚCLEO DEL PROYECTO - Archivos más importantes (los más importados), por dónde empezar a leer
6. SEGURIDAD - Prácticas observadas o faltantes
7. RECOMENDACIONES - Sugerencias para empezar a desarrollar
Análisis técnico:
${plainText}
Informe:`;
}
