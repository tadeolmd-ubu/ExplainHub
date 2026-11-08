# Module: products

Product management API that provides CRUD operations for products.

## File Structure

| File | Purpose |
|------|------|
| `products.controller.ts` | Request handlers and business logic for product CRUD operations. |
| `products.mapper.ts` | Application entry point that maps HTTP requests to domain models. |
| `products.route.ts` | Route definitions for the product management API. |
| `products.service.ts` | Service layer business logic that encapsulates data access and validation. |
| `products.validator.ts` | TypeScript module that defines schema validation rules for products. |

## Functions

| Name | Kind | Async | File | Description |
|------|------|------|------|------|
| list | function | yes | `products.controller.ts` | Returns a paginated list of products. |
| getById | function | yes | `products.controller.ts` | Retrieves a product by its ID. |
| createProduct | function | yes | `products.controller.ts` | Creates a new product. |
| updateProduct | function | yes | `products.controller.ts` | Updates an existing product. |
| deleteProduct | function | yes | `products.controller.ts` | Deletes a product. |
| toNewProduct | function |  | `products.mapper.ts` | Maps HTTP request data to a new product model. |
| createProductAsync | function | yes | `products.service.ts` | Creates a new product asynchronously. |
| updateProductAsync | function | yes | `products.service.ts` | Updates an existing product asynchronously. |
| getProductsAsync | function | yes | `products.service.ts` | Retrieves all products asynchronously. |
| getProductByIdAsync | function | yes | `products.service.ts` | Retrieves a product by its ID asynchronously. |
| deleteProductAsync | function | yes | `products.service.ts` | Deletes a product asynchronously. |

## Exports

| Name | Kind | File |
|------|------|------|
| list | function | `products.controller.ts` |
| getById | function | `products.controller.ts` |
| createProduct | function | `products.controller.ts` |
| updateProduct | function | `products.controller.ts` |
| deleteProduct | function | `products.controller.ts` |
| toNewProduct | function | `products.mapper.ts` |
| productsRouter | const | `products.route.ts` |
| createProductAsync | function | `products.service.ts` |
| updateProductAsync | function | `products.service.ts` |
| getProductsAsync | function | `products.service.ts` |
| getProductByIdAsync | function | `products.service.ts` |
| deleteProductAsync | function | `products.service.ts` |
| idParamSchema | const | `products.validator.ts` |
| skuSchema | const | `products.validator.ts` |
| createProductSchema | const | `products.validator.ts` |
| updateProductSchema | const | `products.validator.ts` |
| listProductsQuerySchema | const | `products.validator.ts` |

## Routes

| Method | Path | File | Params |
|------|------|------|------|
| GET | / | `products.route.ts` |  |
| GET | /:id | `products.route.ts` | id |
| POST | / | `products.route.ts` | email, password |
| PATCH | /:id | `products.route.ts` | id |
| DELETE | /:id | `products.route.ts` | id |

