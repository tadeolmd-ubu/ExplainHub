# Module: components

Reusable React Native UI components for the game screen: the progress bar, speed slider, called-card history, and the large card display.


## File Structure

| File | Purpose |
| ------ | ------ |
| `barra-progreso.tsx` | Animated progress bar that shows the time until the next card |
| `control-velocidad.tsx` | Slider and quick buttons for choosing the card-calling speed |
| `historial.tsx` | Horizontal history of the cards already called in the game |
| `tarjeta-grande.tsx` | Large animated display of the current card with its position |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| BarraProgreso | function |  | `barra-progreso.tsx` | Animates a progress bar for the interval between called cards. |
| ControlVelocidad | function |  | `control-velocidad.tsx` | Renders the slider and speed buttons and reports the chosen index. |
| marcar | arrow |  | `control-velocidad.tsx` | Rounds the slider value and stores the highlighted speed. |
| Historial | function |  | `historial.tsx` | Shows the called cards horizontally and scrolls to the newest one. |
| TarjetaGrande | function |  | `tarjeta-grande.tsx` | Displays the current card with a fade-and-scale transition. |

## Exports

| Name | Kind | File |
|------|------|------|
| default | default | `barra-progreso.tsx` |
| default | default | `control-velocidad.tsx` |
| default | default | `historial.tsx` |
| default | default | `tarjeta-grande.tsx` |
