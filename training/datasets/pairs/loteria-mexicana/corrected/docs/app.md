# Module: app

Expo Router entry point that defines the navigation layout and renders the main game screen, including the loading state, controls, and restart confirmation.


## File Structure

| File | Purpose |
| ------ | ------ |
| `_layout.tsx` | Expo Router root layout with the navigation stack, safe area, and status bar |
| `index.tsx` | Main game screen that wires the hook, controls, history, and card display |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| RootLayout | function |  | `_layout.tsx` | Sets up the navigation stack, safe areas, and status bar for the app. |
| PantallaJuego | function |  | `index.tsx` | Renders the main game screen and connects the game hook to the UI. |
| confirmarReiniciar | arrow |  | `index.tsx` | Shows a confirmation dialog before starting a new game. |
| manejarSiguiente | arrow |  | `index.tsx` | Advances to the next card when a game is already in progress. |

## Exports

| Name | Kind | File |
|------|------|------|
| default | default | `_layout.tsx` |
| default | default | `index.tsx` |
