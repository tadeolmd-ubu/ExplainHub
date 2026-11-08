# Module: utils

Audio and speech helpers that play the game sound effects and announce the drawn card in Spanish.


## File Structure

| File | Purpose |
| ------ | ------ |
| `sonidos.ts` | Sound-effect functions kept as no-ops while the audio library is replaced |
| `voz.ts` | Spanish text-to-speech helper that announces each called card |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| sonidoCarta | function |  | `sonidos.ts` | Plays the card-call sound effect (currently a no-op). |
| sonidoPausa | function |  | `sonidos.ts` | Plays the pause sound effect (currently a no-op). |
| sonidoReanudar | function |  | `sonidos.ts` | Plays the resume sound effect (currently a no-op). |
| sonidoBarajar | function |  | `sonidos.ts` | Plays the shuffle sound effect (currently a no-op). |
| hablar | function |  | `voz.ts` | Stops any current speech and announces the given text in Spanish. |
| terminar | arrow |  | `voz.ts` | Runs the completion callback once for the active speech request. |
| detenerVoz | function |  | `voz.ts` | Cancels the current speech request and ignores its callbacks. |

## Exports

| Name | Kind | File |
|------|------|------|
| sonidoCarta | function | `sonidos.ts` |
| sonidoPausa | function | `sonidos.ts` |
| sonidoReanudar | function | `sonidos.ts` |
| sonidoBarajar | function | `sonidos.ts` |
| hablar | function | `voz.ts` |
| detenerVoz | function | `voz.ts` |
