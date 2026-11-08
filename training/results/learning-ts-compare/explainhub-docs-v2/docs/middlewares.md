# Module: middlewares

Express error middleware that sends JSON errors and logs unexpected ones.

## File Structure

| File | Purpose |
|------|------|
| `errors.ts` | Express error middleware that sends JSON errors and logs unexpected ones. |

## Functions

| Name | Kind | Async | File | Description |
|------|------|------|------|------|
| sendError | function |  | `errors.ts` | Sends a JSON error response with the given status code and message. |
| notFoundHandler | function |  | `errors.ts` | Returns a 404 response with a JSON body describing the missing resource. |
| errorHandler | function |  | `errors.ts` | Wraps an Express handler that throws or returns errors, sending JSON responses as needed. |
| uniqueTarget | function |  | `errors.ts` | Finds and returns the first matching route target from the given request and path. |
| redact | function |  | `errors.ts` | Redacts sensitive fields from the given object before logging it. |
| logUnexpectedError | function |  | `errors.ts` | Logs an unexpected error that occurred during Express routing or middleware execution. |

## Exports

| Name | Kind | File |
|------|------|------|
| notFoundHandler | function | `errors.ts` |
| errorHandler | function | `errors.ts` |

