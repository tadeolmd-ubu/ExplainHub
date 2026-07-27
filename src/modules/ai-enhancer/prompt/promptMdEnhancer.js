export function buildMdEnhancer(markdown, language = "en") {
  const langInstruction =
    language === "es" ? "Responde en español" : "Respond in English";

  return `Eres un experto en documentación técnica. Mejora el siguiente markdown de documentación de un proyecto de software.

  REGLAS ESTRICTAS:
  - NO inventes módulos, funciones, archivos o características que no aparezcan
  - Preserva TODA la información técnica, tablas y datos existentes
  - NO agregues "Título de:" ni ningún prefijo al título del proyecto. Preserva el título exactamente como está
  - NO agregues secciones de recomendaciones, sugerencias, consejos o próximos pasos
  - NO agregues definiciones ni explicaciones de las tecnologías. Solo mencionalas por nombre
  - NO reestructures tablas: preserva el mismo número de columnas, los mismos encabezados, el mismo orden y la misma cantidad de filas
  - NO incluyas rutas absolutas ni relativas. Usa solo nombres de archivos
  - Si existe una sección de esquema de base de datos (Database Schema), presérvala completa
  - Solo mejora la redacción del texto que ya existe, legibilidad y formato
  - Mantén el formato markdown
  - En la tabla File Structure, agrega una descripción corta (10-15 palabras) a la columna Purpose existente, separada con un guion largo (—)
  - Debajo del título de cada módulo (Module: xxx), agrega una descripción de 1-2 oraciones
  - En la tabla Exports, elimina filas con nombre "undefined" y filas duplicadas exactas (mismo nombre + mismo kind + mismo archivo)
  - Para archivos vacíos (Pendiente de implementar), escribe "Archivo sin implementar — pendiente de definir responsabilidad"
  - NO agregues separadores, headers en negrita ni subtítulos dentro de tablas
  - NO elimines secciones existentes del markdown original
  - NO crees secciones nuevas que no existan en el markdown original
  - NO cambies el formato del tree: preserva ├── y └── tal como aparece
  - NO cambies nombres de archivos ni inventes valores para elementos
  - NO agregues notas ni commentary después de las tablas
  - NO vacíes tablas de datos. Si una tabla tiene filas en el original, debe tener las mismas filas en el resultado. Nunca dejes una tabla con solo headers
  - NO cambies el formato de headings. Si el original usa ###, usa ###. Si usa **, usa **. Copia el formato exacto
  - NO traduzcas contenido. Si el markdown original está en español, mantenlo en español. Si está en inglés, mantenlo en inglés
  - NO elimines la sección Get Started si existe en el original
  - NO agregues clases, elementos o contenido inventado al final de tablas
  - ${langInstruction}


Markdown original:
${markdown}

Markdown mejorado:`;
}
