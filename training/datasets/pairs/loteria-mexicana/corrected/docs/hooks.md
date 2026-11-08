# Module: hooks

Game-state hook that shuffles the deck, advances or undoes calls, restores and saves the current game, and coordinates sound and speech feedback.


## File Structure

| File | Purpose |
| ------ | ------ |
| `use-game.ts` | Reducer-based game hook for shuffling, calling, restoring, and saving a game |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| barajarFisherYates | function |  | `use-game.ts` | Returns a randomly shuffled list of all card ids. |
| reducer | function |  | `use-game.ts` | Applies restore, draw, undo, new-game, and speed actions to the game state. |
| useGame | function |  | `use-game.ts` | Exposes the game state and the actions that drive a Lotería session. |

## Exports

| Name | Kind | File |
|------|------|------|
| VELOCIDADES | const | `use-game.ts` |
| useGame | function | `use-game.ts` |
