# Plan de corrección de ExplainHub

## Instrucciones de ejecución

Este documento convierte la revisión del código en tareas verificables. Confirmar cada
problema antes de editar; conservar cambios del usuario; no ejecutar el código de los
repositorios analizados. Todas las ramas de trabajo deben crearse desde `main`
actualizado. Integrar sus commits en otra rama nacida de `main`, resolver conflictos,
ejecutar pruebas y publicar las ramas. No se requiere modificar ni publicar `main`.

Usar commits pequeños con prefijos `fix:`, `test:` y `docs:`. Registrar los resultados
reales en `docs/informe-correcciones.md`, incluyendo pendientes y limitaciones.

## Errores y criterios de aceptación

| ID | Prioridad | Error / ubicación | Solución y aceptación |
|---|---|---|---|
| E01 | P0 | `analyzer.service.js`, `writeDocs`: sobrescribe README y docs del proyecto | Separar salida y fuente. Crear salida independiente y única por defecto; rechazar archivos existentes sin autorización explícita. Prueba que conserve README original. |
| E02 | P0 | `analyzer.service.js`: limpia ZIP después de escribir allí los documentos | Escribir fuera del temporal; devolver rutas existentes y no devolver un repoPath eliminado. Probar servicio completo con ZIP. |
| E03 | P0 | `cloner/index.js`: temporales identificados solo por nombre, borrados si existen | Usar `mkdtemp`, conservar identidad del proyecto en metadatos y limpiar solo el temporal del trabajo. Probar dos extracciones simultáneas del mismo ZIP. |
| E04 | P1 | Validador usa lstat, extractor usa stat | Política única: omitir symlinks internos y comprobar realpath de raíz. No recorrer fuera de raíz ni ciclos. Probar validación y extracción juntas. |
| E05 | P1 | Clonación usa Promise.race sin matar Git ni limpiar timer | Timeout real de proceso y limpieza después de terminar; usar timeout de simple-git. Verificar configuración y errores de clonación. |
| E06 | P1 | `ai-enhancer/index.js`: removeTrailingProse borra párrafos válidos | Preservar prosa, bloques y secciones; evitar reparar tablas destructivamente. Probar texto al final y encabezados repetidos. |
| E07 | P1 | `text-generator/index.js`: padre+nombre no garantiza unicidad | Identidad desde ruta relativa completa; usar un catálogo común para enlaces y archivos. Probar a/shared/utils y b/shared/utils. |
| E08 | P1 | `routesExtractor.js`: Map.get se interpreta como endpoint; faltan montajes | Reconocer Express/Router mediante bindings, distinguir cliente de servidor, resolver prefijos estáticos. Probar Map, cliente HTTP y router montado. |
| E09 | P1 | `analyzer.service.js`: ignora resolved, no reconoce ssh:// ni ZIP mayúsculo | Normalizar y clasificar entrada una vez; validar tipos, formato e idioma antes de procesar. Probar ~, espacios, SSH y .ZIP. |
| E10 | P2 | TXT llama IA sin modelo; streams sin timeout | Configuración única, opción no-AI, cancelación real y diagnóstico del fallback. Probar con clientes simulados sin requerir Ollama. |
| E11 | P2 | Idioma solo se aplica a IA | Localizar etiquetas deterministas y conservar encabezados al mejorar Markdown. Probar español sin IA. |
| E12 | P2 | `readme.js`: genera npm start, main.py o Spring sin evidencia | Obtener comandos de manifiestos/archivos; ante duda informar que no se detectó arranque. Probar Node sin start. |
| E13 | P2 | Parsers convierten errores en archivos vacíos o los omiten | Devolver diagnostics y estadísticas de omitidos/fallos sin abortar todo el proyecto. Probar sintaxis errónea y Python no disponible/error de lote. |
| E14 | P1 | Límites se comprueban al final, sin tope por archivo/profundidad | Cortar recorrido al superar presupuesto; limitar archivos y profundidad; acotar lotes Python. Documentar que el tamaño de checkout no limita la transferencia Git. |
| E15 | P2 | API acepta tipos inválidos, rutas arbitrarias y trabajos ilimitados | Validar cuerpo y devolver 400/413/429; escuchar en loopback por defecto; API limitada a raíz configurada para rutas locales. Documentar exposición y autenticación. |
| E16 | P2 | CLI sin flags, salida de error exitosa y ruta engañosa | Añadir entrada no interactiva, formato, idioma, output, no-ai; salida !=0 en errores; mostrar artefactos y repo retenido correctamente. |
| E17 | P2 | Pruebas ZIP prueban biblioteca; Markdown se autoanaliza; IA admite vacío | Fixtures aislados y aserciones de contenido, conservación de archivos y supervivencia de artefactos. Ejecutar npm test y auditoría de dependencias. |
| E18 | P3 | Configuración, catálogo y metadatos duplicados; comentarios redundantes | Centralizar módulos/config/manifiestos, quitar catch que solo relanza y constructor vacío; preservar arquitectura modular. |
| E19 | P3 | Propósitos PHP inferidos de nombres específicos | Descripciones neutrales; no afirmar funcionalidad de negocio sin evidencia. |
| E20 | P3 | README y CI discrepan, instrucciones imprecisas | Documentar comandos reales, API local, política de salida, pruebas, idiomas y límites. |

## Evidencia inicial

- Reproducido: `postProcess` elimina la explicación final de una sección.
- Reproducido: `cache.get("user")` produce `GET user`.
- Reproducido: dos directorios `*/shared/utils` generan `shared-utils.md`.
- Resto identificado por lectura; añadir regresiones antes de declararlo resuelto.
- Durante la revisión inicial pasaron las nueve pruebas de `ai-enhancer.test.js`;
  eso no prueba preservación de contenido ni calidad de respuestas reales de Ollama.

## Secuencia

1. Documento inicial.
2. Salida de informes y exactitud determinista (E01, E02, E07, E12, E18, E19).
3. Repositorios, rutas y recursos (E03, E04, E05, E09, E14).
4. IA, parsers e interfaces (E06, E08, E10, E11, E13, E15, E16).
5. Integración, regresiones, documentación y publicación (E17, E20).

## Fuera del alcance de la verificación automática

No afirmar validación de todos los lenguajes ni calidad factual de un LLM real solo
por pasar tests simulados. No afirmar que Git tiene cuota de descarga si solo se
limita el checkout. No publicar un servicio de red compartido sin definir su
modelo de autenticación y sus permisos de acceso.
