export function buildPromt(plainText) {
  return `Eres un experto en análisis de código. A partir del siguiente análisis técnico, genera un resumen claro en español que explique qué hace el proyecto, su arquitectura y componentes principales.
Análisis técnico:
${plainText}
Resumen:`;
}
