# Informe de correcciones

## Alcance

Se implementó el plan de `docs/plan-correccion-errores.md` en ramas separadas,
todas creadas desde `main` en `origin/main` (`105ed50`). La rama integrada es
`fix/remediation-integration`. No se modificó ni se publicó `main`.

## Ramas y commits publicados

| Rama | Commit | Trabajo |
|---|---|---|
| `docs/remediation-plan` | `1f42e06` | Plan inicial de errores, prioridades y criterios de aceptación |
| `fix/report-output` | `00afdb9` | Salida independiente, documentos ZIP persistentes y catálogo de módulos sin colisiones |
| `fix/repository-lifecycle` | `a1b0b79` | Temporales únicos, symlinks, límites de recorrido y timeout real de Git |
| `fix/analysis-reliability` | `059d415` | IA segura, rutas Express, diagnósticos, CLI, API y localización |
| `fix/remediation-integration` | `9832a3e` + integración posterior | Integración y documentación final |

Todas las ramas anteriores fueron publicadas en `origin`.

## Cambios implementados

### Seguridad y ciclo de vida

- Se reemplazó `adm-zip` por extracción ZIP mediante `yauzl` y streams.
- Se verifican rutas absolutas, traversal, symlinks, destinos duplicados y bytes
  realmente descomprimidos.
- Cada clon o extracción recibe una carpeta `mkdtemp` única bajo el directorio
  temporal del sistema.
- La limpieza solo acepta carpetas que sean hijas directas del directorio temporal
  controlado por ExplainHub.
- El clon Git usa el plugin de timeout de `simple-git` y finaliza el proceso bloqueado.
- El extractor y el validador comparten límites de profundidad, entradas, archivos,
  tamaño total y tamaño individual.
- Los archivos fuente se abren con `O_NOFOLLOW` cuando el sistema lo soporta.
- Las rutas locales se normalizan y canonicalizan antes de analizarse.

### Informes

- Markdown ya no sobrescribe `README.md` ni `docs` del proyecto analizado.
- Cada ejecución Markdown crea un directorio `report-*` independiente.
- Los artefactos de un ZIP se escriben fuera de la carpeta que se limpiará.
- Se devuelven `outputDir` y `outputPaths` reales.
- Los módulos se identifican mediante hash SHA-256 de su ruta relativa completa.
- Los enlaces del README y los nombres escritos usan el mismo catálogo.
- Los comandos de inicio solo se generan si existe `scripts.start` o `scripts.dev`.
- La salida determinista admite etiquetas en español sin traducir identificadores ni
  contenido de código.

### IA

- Sin `OLLAMA_MODEL`, TXT y Markdown funcionan sin intentar llamar a Ollama.
- Se añadió `--no-ai` y `OLLAMA_TIMEOUT_MS`.
- Las solicitudes tienen límite de entrada, límite de salida, timeout y abort.
- La mejora Markdown solicita únicamente una descripción JSON etiquetada.
- El posprocesado ya no borra prosa final, tablas, código ni encabezados repetidos.
- Si falla la IA, se conserva el informe determinista y se registra un diagnóstico.
- El enriquecimiento Markdown tiene un presupuesto total de dos minutos.

### Parsers y diagnóstico

- `CodeParser` devuelve `diagnostics`, `skippedFiles` y `failureCount`.
- Los lotes Python se limitan a ocho archivos y tienen timeout de subprocess.
- Los errores TOML dejan de convertirse silenciosamente en estructuras vacías.
- Los fallbacks SQL producen warnings.
- Las rutas JavaScript/TypeScript distinguen receptores Express de llamadas como
  `Map.get()` o `axios.get()` y resuelven montajes locales estáticos.

### API y CLI

- La API valida tipos, limita análisis concurrentes a dos y acepta solo rutas locales
  dentro de `ANALYSIS_ROOT`.
- La API escucha en `127.0.0.1` por defecto y puede protegerse con `API_TOKEN`.
- Los errores internos ya no exponen detalles al cliente HTTP.
- La CLI admite `--format`, `--language`, `--output`, `--no-ai` y `--help`.
- Los errores de CLI terminan con código distinto de cero.
- TXT no sobrescribe archivos existentes.

### Dependencias y documentación

- `smol-toml` se actualizó a `1.8.0`.
- Se eliminó `adm-zip`; se usan `yauzl` y `yazl`.
- Se añadió `npm start`, requisito de Node `>=22` y variables de configuración nuevas.
- El workflow ejecuta pruebas en pushes y pull requests hacia `main`.
- Se actualizaron README y documentación de Analyzer, Security, Cloner, Structure
  Extractor, Code Parser, Text Generator y AiEnhancer.

## Verificación

Comandos ejecutados en la rama integrada:

```text
npm test
npm audit --audit-level=moderate
git diff --check
```

Resultado:

- **99 pruebas aprobadas**.
- **0 fallos, 0 canceladas y 0 omitidas**.
- `npm audit`: **0 vulnerabilidades**.
- `git diff --check`: sin errores de whitespace.

Las regresiones cubren salida ZIP real, preservación del README, concurrencia,
symlinks externos y circulares, traversal ZIP, cabeceras de tamaño falsas, timeout
Git, IA simulada, rutas Express, diagnósticos Python/TOML, localización, CLI y API.

## Limitaciones pendientes

- Las rutas dinámicas y frameworks no Express requieren análisis adicional.
- El límite de checkout Git no limita los bytes transferidos por la red.
- La protección de API no sustituye autenticación fuerte, HTTPS ni sandboxing de OS
  en una instalación compartida.
- La interpretación generada por un LLM sigue siendo una inferencia y no una prueba
  del comportamiento en runtime.
- No se afirma validación exhaustiva de cada lenguaje soportado más allá de las
  pruebas existentes.

## Publicación

Las ramas de trabajo fueron subidas al remoto `origin`. GitHub mostró URLs de creación
de Pull Request para cada rama publicada. La rama integrada queda lista para revisión
o Pull Request hacia `main`; no se hizo merge directo a `main`.
