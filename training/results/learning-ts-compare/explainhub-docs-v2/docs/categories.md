# Module: categories

HTTP request handlers and business logic that manage categories, including listing, creating, updating, and deleting.

## File Structure

| File | Purpose |
|------|------|
| `categories.controller.ts` | HTTP request handlers for category CRUD operations |
| `categories.mapper.ts` | Application entry point that maps requests to domain models |
| `categories.route.ts` | Express route definitions for the category endpoints |
| `categories.service.ts` | Service layer that encapsulates business logic and data access |
| `categories.validator.ts` | TypeScript module with request validation schemas |

## Functions

| Name | Kind | Async | File | Description |
|------|------|------|------|------|
| list | function | yes | `categories.controller.ts` | Lists all categories. |
| getById | function | yes | `categories.controller.ts` | Returns a category by its ID. |
| createCategory | function | yes | `categories.controller.ts` | Creates a new category from the request body. |
| updateCategory | function | yes | `categories.controller.ts` | Updates an existing category from the request body. |
| deleteCategory | function | yes | `categories.controller.ts` | Deletes a category by its ID. |
| toNewCategory | function |  | `categories.mapper.ts` | Maps the request to a new category model. |
| createCategoryAsync | function | yes | `categories.service.ts` | Creates a new category asynchronously. |
| updateCategoryAsync | function | yes | `categories.service.ts` | Updates an existing category asynchronously. |
| deleteCategoryAsync | function | yes | `categories.service.ts` | Deletes a category asynchronously. |
| getCategoriesAsync | function | yes | `categories.service.ts` | Lists all categories asynchronously. |
| getCategoryByIdAsync | function | yes | `categories.service.ts` | Returns a category by its ID asynchronously. |

## Exports

| Name | Kind | File |
|------|------|------|
| list | function | `categories.controller.ts` |
| getById | function | `categories.controller.ts` |
| createCategory | function | `categories.controller.ts` |
| updateCategory | function | `categories.controller.ts` |
| deleteCategory | function | `categories.controller.ts` |
| toNewCategory | function | `categories.mapper.ts` |
| categoriesRouter | const | `categories.route.ts` |
| createCategoryAsync | function | `categories.service.ts` |
| updateCategoryAsync | function | `categories.service.ts` |
| deleteCategoryAsync | function | `categories.service.ts` |
| getCategoriesAsync | function | `categories.service.ts` |
| getCategoryByIdAsync | function | `categories.service.ts` |
| createCategorySchema | const | `categories.validator.ts` |
| updateCategorySchema | const | `categories.validator.ts` |
| idParamSchema | const | `categories.validator.ts` |
| listCategoriesQuerySchema | const | `categories.validator.ts` |

## Routes

| Method | Path | File | Params |
|------|------|------|------|
| GET | / | `categories.route.ts` | req, res |
| POST | / | `categories.route.ts` | req, res, email, password |
| GET | /:id | `categories.route.ts` | req, res, id |
| PATCH | /:id | `categories.route.ts` | req, res, id |
| DELETE | /:id | `categories.route.ts` | req, res, id |

