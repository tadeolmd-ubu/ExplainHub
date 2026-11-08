# Module: src

Application entry point that creates the Express app and registers the health route used by deployments.


## File Structure

| File | Purpose |
| ------ | ------ |
| `app.js` | Express application setup with routes, middleware, and a health endpoint |

## Exports

| Name | Kind | File |
|------|------|------|
| default | default | `app.js` |

## Routes

| Method | Path | File | Params |
| ------ | ------ | ------ | ------ |
| GET | /health | `app.js` | req, res |
