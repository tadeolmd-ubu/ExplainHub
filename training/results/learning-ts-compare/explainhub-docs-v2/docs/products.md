# Module: products

E-commerce product management API that exposes CRUD operations and product listing.

## File Structure

| File | Purpose |
|------|------|
| `products.controller.ts` | HTTP request handlers for creating, updating, reading, and deleting products |
| `products.mapper.ts` | Application entry point that maps domain models to DTOs |
| `products.route.ts` | Express route definitions for the product API |
| `products.service.ts` | Service layer that encapsulates business logic and data access |
| `products.validator.ts` | TypeScript module that defines request validation schemas |

## Functions

| Name | Kind | Async | File | Description |
|------|------|------|------|------|
| list | function | yes | `products.controller.ts` | Lists products with pagination. |
| getById | function | yes | `products.controller.ts` | Returns a product by its ID. |
| createProduct | function | yes | `products.controller.ts` | Creates a new product from the request body. |
| updateProduct | function | yes | `products.controller.ts` | Updates an existing product from the request body. |
| deleteProduct | function | yes | `products.controller.ts` | Deletes a product by its ID. |
| toNewProduct | function |  | `products.mapper.ts` | Maps the request body to a new product model. |
| createProductAsync | function | yes | `products.service.ts` | Creates a product asynchronously and returns it. |
| updateProductAsync | function | yes | `products.service.ts` | Updates a product asynchronously and returns it. |
| getProductsAsync | function | yes | `products.service.ts` | Retrieves products asynchronously with pagination. |
| getProductByIdAsync | function | yes | `products.service.ts` | Returns a product by its ID asynchronously. |
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
| GET | / | `products.route.ts` | req, res |
| GET | /:id | `products.route.ts` | id, req, res |
| POST | / | `products.route.ts` | req, res |
| PATCH | /:id | `products.route.ts` | id, req, res |
| DELETE | /:id | `products.route.ts` | id, req, res |

