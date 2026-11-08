# learning-ts

Learning TypeScript project that demonstrates its features and best practices through a simple e-commerce application.

## Overview

| Technology |
|------|
| `Node.js` |
| SQL |
| TypeScript |

| Technology | File |
|------|------|

## Project Info

| Field | Value |
|------|------|
| Version | 1.0.0 |
| License | ISC |
| Homepage | https://github.com/tadeolmd-ubu/Learning-TS#readme |
| Repository | git+https://github.com/tadeolmd-ubu/Learning-TS.git |

## Dependencies

| Name | Version | Type |
|------|------|------|
| @prisma/adapter-pg | ^7.10.1 | dependencies |
| @prisma/client | ^7.10.1 | dependencies |
| dotenv | ^18.0.8 | dependencies |
| express | ^5.3.0 | dependencies |
| pg | ^8.23.1 | dependencies |
| zod | ^4.6.7 | dependencies |
| @types/express | ^5.0.6 | dev-dependencies |
| @types/jest | ^30.0.0 | dev-dependencies |
| @types/node | ^26.6.5 | dev-dependencies |
| @types/pg | ^8.23.1 | dev-dependencies |
| jest | ^30.5.2 | dev-dependencies |
| prisma | ^7.10.1 | dev-dependencies |
| ts-jest | ^29.4.15 | dev-dependencies |
| tsx | ^4.23.15 | dev-dependencies |
| typescript | ^6.0.3 | dev-dependencies |

## Project Structure

```
learning-ts/
├── .gitignore
├── AUDIT.md
├── README.md
├── package-lock.json
├── package.json
├── prisma
│   ├── migrations
│   │   ├── 20261019232726_init
│   │   │   └── migration.sql
│   │   ├── 20261020213915_add_product
│   │   │   └── migration.sql
│   │   ├── 20261028220918_add_product_sku
│   │   │   └── migration.sql
│   │   ├── 20261030005011_add_category
│   │   │   └── migration.sql
│   │   ├── 20261030005040_make_category_required
│   │   │   └── migration.sql
│   │   ├── 20261104034502_rename_product_updated_at
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── prisma7.config.ts
├── skills-lock.json
├── src
│   ├── app.ts
│   ├── lib
│   │   ├── client.prisma.ts
│   │   └── errors.ts
│   ├── middlewares
│   │   └── errors.ts
│   ├── modules
│   │   ├── categories
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.mapper.ts
│   │   │   ├── categories.route.ts
│   │   │   ├── categories.service.ts
│   │   │   └── categories.validator.ts
│   │   └── products
│   │       ├── products.controller.ts
│   │       ├── products.mapper.ts
│   │       ├── products.route.ts
│   │       ├── products.service.ts
│   │       └── products.validator.ts
│   └── server.ts
└── tsconfig.json
```

## Modules

| Module | Files | Description |
|------|------|------|
| [20261019232726_init](docs/20261019232726_init.md) | 1 | SQL scripts that create the database schema. |
| [20261020213915_add_product](docs/20261020213915_add_product.md) | 1 | SQL scripts that add product-related tables. |
| [20261028220918_add_product_sku](docs/20261028220918_add_product_sku.md) | 1 | SQL scripts that add product SKU-related tables. |
| [20261030005011_add_category](docs/20261030005011_add_category.md) | 1 | SQL scripts that add category-related tables. |
| [20261030005040_make_category_required](docs/20261030005040_make_category_required.md) | 1 | SQL scripts that make the category required. |
| [20261104034502_rename_product_updated_at](docs/20261104034502_rename_product_updated_at.md) | 1 | SQL scripts that rename product updated-at timestamps. |
| [src](docs/src.md) | 2 | Application entry points and setup files. |
| [lib](docs/lib.md) | 2 | Shared helpers and models used by the application. |
| [middlewares](docs/middlewares.md) | 1 | Express middleware that catches errors and returns JSON responses. |
| [categories](docs/categories.md) | 5 | Controllers, mappers, routes, services, and validators for categories. |
| [products](docs/products.md) | 5 | Controllers, mappers, routes, services, and validators for products. |

## Database Schema

| Type | Name | Details |
|------|------|------|
| Table | User | 5 columns |
| Index | User_email_key | ON User |

