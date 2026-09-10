# Correcciones V2

## Rama

Los cambios se realizaron en `fix/remediation-v2`, creada desde el `main` remoto
actualizado. `main` no fue modificado directamente.

## Problemas corregidos

### 1. Falsos endpoints Express

`routesExtractor.js` ahora identifica ámbitos de funciones y omite llamadas cuyo
receptor está oculto por un parámetro o una variable local. Esto evita registrar,
por ejemplo, `cache-key` cuando una función recibe un parámetro llamado `app`.
También se contemplan parámetros destructurados y se evita incorporar bindings de
funciones anidadas al ámbito exterior.

### 2. Expansión excesiva de routers

`resolveRoutes.js` aplica un presupuesto global de 10.000 expansiones y un máximo de
100 prefijos por ruta durante el recorrido, no después de construir todos los
resultados. Los ciclos siguen protegidos por el conjunto de visitados y los
truncamientos dejan una advertencia en `routeDiagnostics`.

`CodeParser` incorpora esas advertencias a sus diagnósticos públicos.

### 3. Lectura de archivos sin límite efectivo

`fileUtils.readFile()` conserva el rechazo rápido por tamaño declarado, pero ahora
lee en bloques de 64 KiB y cuenta los bytes recibidos antes de acumular el contenido.
Si el archivo crece durante la lectura, la operación se interrumpe al superar
`maxFileBytes`. `StringDecoder` mantiene correctos los caracteres UTF-8 divididos
entre bloques.

### 4. Tablas Markdown inválidas

El generador Markdown usa `escapeCell()` para los valores escritos en tablas.
Escapa barras verticales y transforma saltos de línea en `<br>`. Se aplica a
metadatos del proyecto, dependencias, features, módulos y esquema de base de datos.

### 5. Pérdida de rutas de entry points

El README ya no aplica `path.basename()` a los entry points. Conserva la ruta
relativa completa, por ejemplo `api/index.js` y `web/index.js`, evitando nombres
ambiguos como dos veces `index.js`.

### 6. Directorios vacíos en ZIP

La extracción streaming con `yauzl` ahora crea explícitamente las entradas de
directorio antes de continuar. Se mantiene la validación de traversal, symlinks,
profundidad, cantidad de entradas y tamaños comprimidos/descomprimidos.

## Pruebas añadidas

`test/remediation-v2.test.js` cubre:

- Receptor Express oculto por parámetro local.
- Límite de expansión de montajes.
- Escape de celdas Markdown y rutas completas.
- Preservación de directorios vacíos dentro de ZIP.
- Rechazo de archivos sobredimensionados durante lectura.

También se actualizó `test/helpers/zip.js` para generar entradas de directorio
vacías reales con `yazl`.

## Verificación

Comandos ejecutados:

```text
npm test
npm audit --audit-level=moderate
git diff --check
```

Resultado final:

- **104 pruebas aprobadas**.
- **0 fallos, 0 canceladas y 0 omitidas**.
- **0 vulnerabilidades** reportadas por `npm audit`.
- Sin errores de whitespace.

## Límites y notas

- El análisis Express continúa siendo estático: no puede resolver con precisión
  aliases dinámicos ni rutas construidas en runtime.
- Los presupuestos de rutas evitan consumo ilimitado, pero un análisis truncado
  puede omitir algunas variantes y lo informa en los diagnósticos.
- La comprobación inicial de tamaño sigue siendo necesaria para rechazar archivos
  grandes sin abrirlos completamente; la lectura por bloques cubre cambios durante
  la operación.

## Próximo paso

Revisar y fusionar la rama `fix/remediation-v2` mediante un PR hacia `main`. La rama
contiene únicamente los cambios V2 y sus pruebas; no se realizaron cambios directos
en `main`.
