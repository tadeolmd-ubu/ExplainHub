# Module: storage

AsyncStorage wrapper that persists the current deck, called cards, and speed selection between app launches.


## File Structure

| File | Purpose |
| ------ | ------ |
| `storage.ts` | AsyncStorage helpers that load, save, and clear the current game |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| cargarPartida | function | yes | `storage.ts` | Reads and validates the saved game from AsyncStorage. |
| guardarPartida | function | yes | `storage.ts` | Persists the current deck, called cards, and speed selection. |
| limpiarPartida | function | yes | `storage.ts` | Removes the saved game from AsyncStorage. |

## Exports

| Name | Kind | File |
|------|------|------|
| CLAVE_PARTIDA | const | `storage.ts` |
| cargarPartida | function | `storage.ts` |
| guardarPartida | function | `storage.ts` |
| limpiarPartida | function | `storage.ts` |
