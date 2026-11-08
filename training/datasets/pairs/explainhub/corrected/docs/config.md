# Module: config

Environment configuration loader that reads required variables and fails fast when they are invalid.


## File Structure

| File | Purpose |
| ------ | ------ |
| `env.js` | Loads environment variables and validates required application configuration |

## Functions

| Name | Kind | Async | File | Description |
| ------ | ------ | ------ | ------ | ------ |
| optional | function |  | `env.js` | Implements the optional helper used by this module. |
| validateEnv | function |  | `env.js` | Validates env before continuing. |

## Exports

| Name | Kind | File |
|------|------|------|
| config | const | `env.js` |
| validateEnv | function | `env.js` |
