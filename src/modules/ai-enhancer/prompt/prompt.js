export function buildPrompt(plainText) {
  return `Eres un experto en análisis de código. A partir del siguiente análisis técnico de un proyecto real, genera un informe en español con estos apartados. IMPORTANTE: Basa tu respuesta ÚNICAMENTE en la información proporcionada. NO inventes módulos, archivos o funcionalidades que no aparezcan en el análisis.

1. VISIÓN GENERAL - Qué hace el proyecto, tecnologías principales, tipo de arquitectura
2. MÓDULOS Y COMPONENTES - Por cada módulo listado: su responsabilidad y cómo se relaciona con los demás (menciona SOLO los que aparecen en el análisis)
3. API / RUTAS - Endpoints disponibles (solo si aparecen en el análisis)
4. DEPENDENCIAS EXTERNAS - Librerías clave que usa el proyecto
5. NÚCLEO DEL PROYECTO - Archivos más importados, por dónde empezar a leer
6. SEGURIDAD - Prácticas observadas o faltantes
7. RECOMENDACIONES - Sugerencias para empezar a desarrollar

Responde en español. Usa SOLO texto plano. NO uses markdown, negritas, tablas ni enlaces.

Análisis técnico:
${plainText}

Informe:`;
}
