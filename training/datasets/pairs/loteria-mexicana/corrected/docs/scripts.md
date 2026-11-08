# Module: scripts

Python maintenance scripts that generate the app icons and sound effects and import the 54 card images into the assets folder.


## File Structure

| File | Purpose |
| ------ | ------ |
| `generar_iconos.py` | Generates the app icon and adaptive-icon images with Pillow |
| `generar_sonidos.py` | Synthesizes the WAV sound effects for cards, pauses, and shuffling |
| `importar_cartas.py` | Downloads and converts the 54 card images into the assets folder |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| tint_glyph | function |  | `generar_iconos.py` | Renders a glyph in a solid colour with a transparent background. |
| make_icon | function |  | `generar_iconos.py` | Draws and saves the main 1024px app icon. |
| make_adaptive | function |  | `generar_iconos.py` | Creates the Android adaptive icon layers from the base artwork. |
| make_splash | function |  | `generar_iconos.py` | Generates the square splash-screen image for the app. |
| escribir | function |  | `generar_sonidos.py` | Writes a list of floating-point samples to a mono WAV file. |
| nota | function |  | `generar_sonidos.py` | Synthesizes a decaying musical note at the given frequency. |
| ruido | function |  | `generar_sonidos.py` | Generates a short burst of smoothed random noise. |
| chasquido | function |  | `generar_sonidos.py` | Generates a very short click at the requested frequency. |
| carta | function |  | `generar_sonidos.py` | Builds the click-and-slide sound used when a card is called. |
| dupla | function |  | `generar_sonidos.py` | Writes the pause or resume cue from two descending or ascending notes. |
| barajar | function |  | `generar_sonidos.py` | Writes the shuffling sound effect from several noise bursts. |
| main | function |  | `generar_sonidos.py` | Regenerates every sound effect in the sounds folder. |
| descargar_cached | function |  | `importar_cartas.py` | Downloads one card image once and caches it in the temporary folder. |
| procesar | function |  | `importar_cartas.py` | Converts one card image to a square JPEG over the cream background. |
| main | function |  | `importar_cartas.py` | Imports all 54 cards and writes the processed images. |

## Exports

| Name | Kind | File |
|------|------|------|
| R | module | `generar_iconos.py` |
| GLYPH_FONT | module | `generar_iconos.py` |
| FONT_BOLD | module | `generar_iconos.py` |
| OUT | module | `generar_iconos.py` |
| tint_glyph | module | `generar_iconos.py` |
| make_icon | module | `generar_iconos.py` |
| make_adaptive | module | `generar_iconos.py` |
| make_splash | module | `generar_iconos.py` |
| RATE | module | `generar_sonidos.py` |
| BASE | module | `generar_sonidos.py` |
| DESTINO | module | `generar_sonidos.py` |
| escribir | module | `generar_sonidos.py` |
| nota | module | `generar_sonidos.py` |
| ruido | module | `generar_sonidos.py` |
| chasquido | module | `generar_sonidos.py` |
| carta | module | `generar_sonidos.py` |
| dupla | module | `generar_sonidos.py` |
| barajar | module | `generar_sonidos.py` |
| main | module | `generar_sonidos.py` |
| BASE | module | `importar_cartas.py` |
| DESTINO | module | `importar_cartas.py` |
| TMP | module | `importar_cartas.py` |
| CREMA | module | `importar_cartas.py` |
| CANVAS | module | `importar_cartas.py` |
| CALIDAD_JPEG | module | `importar_cartas.py` |
| GITHUB_ORIGEN | module | `importar_cartas.py` |
| DRIVE | module | `importar_cartas.py` |
| GITHUB | module | `importar_cartas.py` |
| descargar_cached | module | `importar_cartas.py` |
| procesar | module | `importar_cartas.py` |
| main | module | `importar_cartas.py` |
