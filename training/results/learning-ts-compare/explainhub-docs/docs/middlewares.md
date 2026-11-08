# Module: middlewares

Middleware that catches and handles errors, logs unexpected ones, and provides a 404 handler.

## File Structure

| File | Purpose |
|------|------|
| `errors.ts` | Error middleware that sends error responses and logs unexpected errors. |

## Functions

| Name | Kind | Async | File | Description |
|------|------|------|------|------|
| sendError | function |  | `errors.ts` | Sends an error response with the given status code and message. |
| notFoundHandler | function |  | `errors.ts` | Returns a 404 response when the requested route is not found. |
| errorHandler | function |  | `errors.ts` | Handles errors by sending an error response or logging unexpected ones. |
| uniqueTarget | function |  | `errors.ts` | Finds the first matching target in the given array of targets. |
| redact | function |  | `errors.ts` | Redacts sensitive data from the given object. |
| logUnexpectedError | function |  | `errors.ts` | Logs an unexpected error and sends a 500 response. |

## Exports

| Name | Kind | File |
|------|------|------|
| notFoundHandler | function | `errors.ts` |
| errorHandler | function | `errors.ts` |

