# StockWise

StockWise is a local inventory workspace for products, stock levels, and stock movements. It is a small typed monorepo: a React UI and an Express API, with MySQL for development and a self-contained SQLite demo.

The application runs on your machine. Hosting on Railway in front of a private MySQL database is prepared in the scripts below. Nothing is deployed.

## Quick start

Demo mode needs Node.js and pnpm. It does not need MySQL or any other database server.

```bash
pnpm install
pnpm demo
```

- UI: http://localhost:5180
- API health: http://127.0.0.1:3010/health

`pnpm demo` generates both Prisma clients, creates `packages/db/data/demo.db` when that file is missing, applies the SQLite migrations, and starts the API and the Vite dev server. On startup the API inserts sample inventory when the product table is empty.

The fresh sample is 12 products across Beverages, Cleaning, Dairy, Pantry, and Produce, with 23 stock movements. Some products are at or below their minimum, so the dashboard has totals and a low-stock list immediately: 12 products, 218 units on hand, inventory value `635.86`, 5 low-stock products, and 23 movements.

Starting `pnpm demo` again keeps the rows already stored, including edits made in the UI. Sample rows are inserted only while the product table is empty.

`packages/db/.env` is not required. When that file exists, demo mode leaves it in place and does not migrate or write to MySQL.

On Windows, if PowerShell refuses to run `pnpm.ps1`, invoke `pnpm.cmd` instead.

### Reset demo data

Stop `pnpm demo`, then from the repository root:

```bash
pnpm demo:reset
pnpm demo
```

`pnpm demo:reset` deletes `packages/db/data/demo.db` and the SQLite sidecar files next to it (`-journal`, `-wal`, `-shm`). The next `pnpm demo` creates the file, applies the schema, and loads the sample inventory again. MySQL data stays unchanged.

## Features

- Product catalog with name, unique SKU, category, decimal price, quantity on hand, and a minimum quantity.
- Search products by name or SKU.
- Stock movements of type `IN` or `OUT`. Quantity on hand changes only through a movement, not by editing the product.
- Low-stock list: a product is low when its quantity is less than or equal to its minimum.
- Dashboard totals: product count, units on hand, inventory value (price × quantity), low-stock count, and movement count. The UI loads the latest movements from the movements endpoint.
- A product that already has movements cannot be deleted.

There is no user authentication.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| MySQL | MySQL 8, Prisma 7, `@prisma/adapter-mariadb` |
| SQLite demo | Prisma 7, `@prisma/adapter-better-sqlite3` |
| Workspace | pnpm workspaces |

Package versions are pinned in each `package.json` and in `pnpm-lock.yaml`. The workspace requires Node.js `>=22.14.0` and pnpm `>=10.34.0` (`packageManager` is `pnpm@10.34.8`).

## Prerequisites

- Node.js 22.14 or newer
- pnpm 10.34 or newer (Corepack can provide it)

Demo mode has no further requirements. `pnpm install` builds `better-sqlite3`, which the SQLite adapter uses.

MySQL mode also needs MySQL 8 listening on port `3306` and an empty database named `stockwise`. Docker is not used.

## SQLite demo mode

Demo mode is the same API and UI as MySQL mode, with the database stored in `packages/db/data/demo.db`.

| | |
|---|---|
| Start | `pnpm demo` |
| UI | http://localhost:5180 |
| API | http://127.0.0.1:3010 |
| Schema | `packages/db/prisma/schema.sqlite.prisma` |
| Migrations | `packages/db/prisma/migrations-sqlite`, applied by `pnpm demo` |
| Client | `packages/db/generated/prisma-sqlite` with `@prisma/adapter-better-sqlite3` |

`pnpm demo` runs `pnpm db:generate`, then `prisma migrate deploy` through the SQLite config (`packages/db/prisma.sqlite.config.ts`). It then starts the API with `PORT=3010` and a `file:` database URL, and starts Vite with `STOCKWISE_WEB_PORT=5180`. Vite proxies `/api` and `/health` to `http://127.0.0.1:3010`. These ports stay fixed so a MySQL API already listening on port 3001 is not used.

Prisma 7 generates a separate query compiler per provider, so the SQLite schema and client are separate from MySQL. SQLite stores `Decimal` as `DECIMAL` and the movement type as text. HTTP validation and JSON responses match MySQL mode, including two-decimal price strings.

The file is created on first migrate. Seeding runs inside the API process and checks the product count, so a restart does not insert a second copy of the sample.

## MySQL development mode

Use this path when you want the API on port 3001 against a local MySQL database.

Create the database before migrating:

```sql
CREATE DATABASE stockwise;
```

From the repository root, install dependencies and copy the example environment file:

```bash
pnpm install
cp .env.example packages/db/.env
```

On PowerShell:

```powershell
Copy-Item .env.example packages\db\.env
```

Edit `packages/db/.env` and replace the placeholders. Do not commit that file.

```text
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/stockwise"
```

If the password contains `@`, `:`, `/`, `?`, `#`, `%`, or a space, percent-encode those characters in the URL. A literal `!` is written as `%21`. Do not encode it twice.

The API reads `DATABASE_URL` from the process environment when that variable is already set, and otherwise from `packages/db/.env`. It listens on `0.0.0.0` and on `PORT`, or on port `3001` when `PORT` is unset. The `PORT` line in `.env.example` documents that default. It is not loaded from `packages/db/.env`.

Apply the committed MySQL migration and generate both Prisma clients:

```bash
pnpm --filter @stockwise/db exec prisma migrate deploy
pnpm db:generate
```

`prisma migrate deploy` applies migrations already in `packages/db/prisma/migrations`. It does not create a new one. The current migration is `20261027133059_add_inventory`, which creates `Product` and `StockMovement`.

Start the API and the UI in two terminals:

```bash
pnpm dev:api
pnpm dev:web
```

- UI: http://localhost:5173
- API health: http://localhost:3001/health

Vite proxies `/api` and `/health` to `http://localhost:3001`. If port `5173` is taken, Vite prints the next free port. The proxy target stays port 3001.

To run the API once, without the file watcher:

```bash
pnpm start:api
```

### Production scripts

These scripts target MySQL. They do not start SQLite demo mode.

| Script | What it does |
|---|---|
| `pnpm build` | Generates both Prisma clients, then builds the React app into `apps/web/dist`. |
| `pnpm start` | Applies the MySQL migrations with `prisma migrate deploy`, then starts Express. |
| `pnpm start:api` | Starts Express without migrating. |

`pnpm build` does not connect to a database. `pnpm start` migrates whatever MySQL database `DATABASE_URL` points at. Run it only against the database you intend to migrate.

A local production process, after `pnpm build` and `pnpm start:api`, serves the built UI and the API on port `3001` (or `PORT`).

Railway is prepared as one web service plus a private MySQL database: build with `pnpm build`, start with `pnpm start`, health check `/health`. This repository does not create that project, and the app is not deployed. The committed MySQL migration is `20261027133059_add_inventory`. SQLite migrations are applied only by `pnpm demo`.

## Architecture

```text
apps/web            React UI. Calls /api and /health on the Vite dev server.
apps/api            Express API. Owns HTTP, validation, and inventory rules.
packages/db         MySQL and SQLite Prisma schemas, migrations, clients, and demo seed.
packages/shared     Service name and the health response type.
```

The browser does not talk to the database. In development, Vite proxies `/api` and `/health` to the API. In a production start, Express serves `apps/web/dist` on the same host and port as the API, so those relative paths stay the same.

A `mysql://` URL uses the MariaDB adapter and `packages/db/generated/prisma`. A `file:` URL uses the SQLite client in `packages/db/generated/prisma-sqlite`. The SQLite client is loaded only for a `file:` URL. `pnpm demo` sets that URL for its API process.

`packages/shared` exports the service name and the health payload type. Product and movement types live next to the API and UI that use them.

The web app does not import the database package. The API does not import React. The database package does not import either app.

## API endpoints

Successful JSON errors use `{ "error": { "code": "...", "message": "..." } }`. `DELETE` returns `204` with an empty body. Validation failures return `400` with code `VALIDATION_ERROR`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check. Body: `{ "service": "stockwise", "status": "ok" }`. |
| `GET` | `/api/products` | List products, ordered by name. Optional `q` matches name or SKU. |
| `GET` | `/api/products/:id` | One product. `404` when it is missing. |
| `POST` | `/api/products` | Create a product. `201` with the stored product. |
| `PUT` | `/api/products/:id` | Update name, SKU, category, price, and/or minimum quantity. |
| `DELETE` | `/api/products/:id` | Delete a product that has no movements. |
| `GET` | `/api/stock-movements` | Movement history, newest first. Optional `productId`. |
| `POST` | `/api/stock-movements` | Record `IN` or `OUT` and update quantity in one transaction. |
| `GET` | `/api/dashboard` | Counts, inventory value, and the low-stock list. |

Create body fields: `name`, `sku`, `category`, `price`, and optional `quantity` and `minQuantity` (both default to `0`). Price is a non-negative decimal with at most two fractional digits. The response returns `price` as a two-decimal string.

Update body: at least one of `name`, `sku`, `category`, `price`, `minQuantity`. Sending `quantity` is rejected. Stock changes go through movements.

Movement body: `productId`, `type` (`IN` or `OUT`), and `quantity` (integer from `1` upward).

Dashboard body:

```json
{
  "productCount": 0,
  "totalQuantity": 0,
  "lowStockCount": 0,
  "inventoryValue": "0.00",
  "movementCount": 0,
  "lowStock": []
}
```

`lowStock` items include `id`, `name`, `sku`, `quantity`, and `minQuantity`. Recent movement rows are not part of this payload. The empty object above is the shape for an empty database. A fresh SQLite demo returns the seeded totals described in Quick start.

## Inventory business rules

- SKU is unique. A duplicate returns `409` with code `DUPLICATE_SKU`.
- Price is stored as MySQL `DECIMAL(10, 2)`. SQLite demo mode stores the same values as SQLite `DECIMAL`. Responses return a two-decimal string in both modes.
- `IN` increases quantity and `OUT` decreases it inside a database transaction.
- An `OUT` that would make quantity negative is rejected with `409` and code `INSUFFICIENT_STOCK`. The stored quantity is left unchanged.
- An `IN` that would overflow the signed 32-bit integer range is rejected with `409` and code `QUANTITY_LIMIT`.
- Deleting a product that still has movements is rejected with `409` and code `PRODUCT_HAS_MOVEMENTS`. The foreign key uses `ON DELETE RESTRICT`.
- A product is low stock when `quantity <= minQuantity`.

## Tests and validation

There is no automated unit or integration suite.

These commands run from the repository root:

```bash
pnpm typecheck
pnpm build
pnpm build:web
pnpm --filter @stockwise/web lint
pnpm db:validate
pnpm db:generate
```

- `pnpm typecheck` runs TypeScript in `apps/web`, `apps/api`, `packages/db`, and `packages/shared`.
- `pnpm build` generates both Prisma clients, then runs `pnpm build:web`.
- `pnpm build:web` typechecks the UI and produces a Vite production build.
- `pnpm --filter @stockwise/web lint` runs oxlint on the UI.
- `pnpm db:validate` checks `schema.prisma` and `schema.sqlite.prisma`. It does not open a database connection.
- `pnpm db:generate` writes the MySQL client and the SQLite client. It does not migrate either database.

## Limitations

- No authentication, roles, or multi-user accounts. A public URL would expose the same write API.
- Prepared for Railway, and not hosted anywhere. There is no CI workflow.
- No automated test suite.
- Movement history cannot be edited or reversed. The only correction is another movement.
- Products with history cannot be deleted.
- The dashboard endpoint does not include movement rows. The UI loads those separately.
- The API reads only `DATABASE_URL` from `packages/db/.env`. Other keys in that file are ignored. `pnpm demo` supplies its own SQLite URL for its child processes and does not write that file.
- `pnpm start` migrates MySQL. SQLite demo mode is a local file and is started only with `pnpm demo`.
- There is no file import, barcode flow, or warehouse transfer model.
