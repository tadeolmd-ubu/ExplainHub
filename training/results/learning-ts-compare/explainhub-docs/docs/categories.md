# Module: categories

Categories API that provides CRUD operations for categories.

## File Structure

| File | Purpose |
|------|------|
| `categories.controller.ts` | Request handlers and business logic for category CRUD operations. |
| `categories.mapper.ts` | Application entry point that maps request to the service layer. |
| `categories.route.ts` | Route definitions for the Categories API. |
| `categories.service.ts` | Service layer business logic for category CRUD operations. |
| `categories.validator.ts` | TypeScript module with validation schemas for the Categories API. |

## Functions

| Name | Kind | Async | File | Description |
|------|------|------|------|------|
| list | function | yes | `categories.controller.ts` | Returns a list of categories. |
| getById | function | yes | `categories.controller.ts` | Returns a category by its ID. |
| createCategory | function | yes | `categories.controller.ts` | Creates a new category. |
| updateCategory | function | yes | `categories.controller.ts` | Updates an existing category. |
| deleteCategory | function | yes | `categories.controller.ts` | Deletes a category. |
| toNewCategory | function |  | `categories.mapper.ts` | Maps request data to the service layer. |
| createCategoryAsync | function | yes | `categories.service.ts` | Creates a new category asynchronously. |
| updateCategoryAsync | function | yes | `categories.service.ts` | Updates an existing category asynchronously. |
| deleteCategoryAsync | function | yes | `categories.service.ts` | Deletes a category asynchronously. |
| getCategoriesAsync | function | yes | `categories.service.ts` | Returns all categories asynchronously. |
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
| GET | / | `categories.route.ts` |  |
| POST | / | `categories.route.ts` | email, password |
| GET | /:id | `categories.route.ts` | id |
| PATCH | /:id | `categories.route.ts` | id |
| DELETE | /:id | `categories.route.ts` | id |

