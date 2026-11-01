# StockWise

StockWise is a local inventory workspace for tracking products, stock levels, and stock movements. It is a portfolio project aimed at developers and technical reviewers who want to see a small, typed monorepo with a React interface and an Express API backed by MySQL.

The application is not deployed. It runs on your machine.

## Key features

- Product catalog with name, unique SKU, category, decimal price, quantity on hand, and a minimum quantity.
- Search products by name or SKU.
- Stock movements of type `IN` or `OUT`. Quantity on hand changes only through a movement, not by editing the product.
- Low-stock list: a product is low when its quantity is less than or equal to its minimum.
- Dashboard totals: product count, units on hand, inventory value (price × quantity), low-stock count, and movement count. The UI also shows the latest movements from the movements endpoint.
- A product that already has movements cannot be deleted.

There is no user authentication.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL 8, Prisma 7, `@prisma/adapter-mariadb` |
| Workspace | pnpm workspaces |

Package versions are pinned in each `package.json` and in `pnpm-lock.yaml`. The workspace requires Node.js `>=22.14.0` and pnpm `>=10.34.0` (`packageManager` is `pnpm@10.34.8`).

## Architecture

```text
apps/web            React UI. Calls /api and /health on the Vite dev server.
apps/api            Express API. Owns HTTP, validation, and inventory rules.
packages/db         Prisma schema, migrations, and createPrismaClient().
packages/shared     Small shared constants and the health response type.
```

The browser does not talk to MySQL. In development, Vite (port `5173`) proxies `/api` and `/health` to the API (port `3001`). The API loads `DATABASE_URL` from `packages/db/.env` and uses the Prisma client exported by `@stockwise/db`. Prisma connects with the MariaDB driver adapter.

`packages/shared` currently exports the service name and the health payload type. Product and movement types live next to the API and UI that use them.

Ownership boundaries used while building the repo are written in `.cursor/agents/`. The web app does not import the database package. The API does not import React. The database package does not import either app.

## Getting started

### Prerequisites

- Node.js 22.14 or newer
- pnpm 10.34 or newer (Corepack can provide it)
- MySQL 8 listening on port `3306`
- An empty database named `stockwise`

Docker is not used.

Create the database with your MySQL client before migrating. Example, using your own account when the client prompts for a password:

```sql
CREATE DATABASE stockwise;
```

### Install

From the repository root:

```powershell
pnpm install
Copy-Item .env.example packages\db\.env
```

Edit `packages/db/.env` and replace the placeholders. Do not commit that file.

```text
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/stockwise"
```

If the password contains characters such as `@`, `:`, `/`, `?`, `#`, `%`, or a space, percent-encode those characters in the URL. A literal `!` is written as `%21`. Do not encode it twice.

The API reads `DATABASE_URL` from `packages/db/.env`. It listens on `PORT` from the process environment, or on `3001` when `PORT` is unset. The `PORT` line in `.env.example` documents that default. It is not loaded from `packages/db/.env`.

### Migrations and client

Apply the existing migration, then generate the Prisma client:

```powershell
pnpm --filter @stockwise/db exec prisma migrate deploy
pnpm db:generate
```

`prisma migrate deploy` only applies migrations already in `packages/db/prisma/migrations`. It does not create a new one. The current migration is `20261027133059_add_inventory`, which creates `Product` and `StockMovement`.

### Run

Use two terminals from the repository root:

```powershell
pnpm dev:api
pnpm dev:web
```

- UI: http://localhost:5173
- API health: http://localhost:3001/health

If port `5173` is already taken, Vite prints the next free port. Use that URL. The proxy target stays `http://localhost:3001`.

To run the API once, without the file watcher:

```powershell
pnpm start:api
```

## API endpoints

Successful JSON errors use `{ "error": { "code": "...", "message": "..." } }`. `DELETE` returns `204` with an empty body.

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

`lowStock` items include `id`, `name`, `sku`, `quantity`, and `minQuantity`. Recent movement rows are not part of this payload.

## Business rules

- SKU is unique. A duplicate returns `409` with code `DUPLICATE_SKU`.
- Price is stored as MySQL `DECIMAL(10, 2)`.
- `IN` increases quantity and `OUT` decreases it inside a database transaction.
- An `OUT` that would make quantity negative is rejected with `409` and code `INSUFFICIENT_STOCK`. The stored quantity is left unchanged.
- An `IN` that would overflow the integer column is rejected with `409` and code `QUANTITY_LIMIT`.
- Deleting a product that still has movements is rejected with `409` and code `PRODUCT_HAS_MOVEMENTS`. The foreign key uses `ON DELETE RESTRICT`.
- A product is low stock when `quantity <= minQuantity`.

## AI-assisted development

The repository was built in Cursor with specialized project agents under `.cursor/agents/`:

| Agent | Scope |
|---|---|
| `architect` | Workspace layout and package boundaries |
| `frontend` | `apps/web` |
| `backend` | `apps/api` |
| `database` | `packages/db` |
| `qa` | Checks and verification |
| `devops` | Local setup and `.env.example` |

Each agent file states what that role may edit. The split kept UI, HTTP, and schema changes in separate places while the app was assembled.

## Testing

There is no automated unit or integration suite in the repository.

These commands exist and can be run from the root:

```powershell
pnpm typecheck
pnpm build:web
pnpm --filter @stockwise/web lint
pnpm db:validate
```

- `pnpm typecheck` runs TypeScript in `apps/web`, `apps/api`, `packages/db`, and `packages/shared`.
- `pnpm build:web` typechecks the UI and produces a Vite production build.
- `pnpm --filter @stockwise/web lint` runs oxlint on the UI.
- `pnpm db:validate` checks `schema.prisma`. It does not prove that MySQL accepted a connection.

During development, `pnpm typecheck` and `pnpm build:web` completed successfully. Product create, read, update, and delete, stock in and stock out, insufficient stock, and the dashboard were exercised manually against a local MySQL database. The UI was opened against the Vite dev server and the same API.

## Limitations and possible next steps

- No authentication, roles, or multi-user accounts.
- No deployment configuration and no hosted environment.
- No automated test suite and no CI workflow.
- Movement history cannot be edited or reversed. The only correction is another movement.
- Products with history cannot be deleted from the API.
- The dashboard endpoint does not include movement rows. The UI loads those separately.
- The API reads only `DATABASE_URL` from `packages/db/.env`. Other keys in that file are ignored.
- One local MySQL database is assumed. There is no file import, barcode flow, or warehouse transfer model.

Reasonable follow-ups are an automated API test suite, authenticated users, editable movement notes, and a deployment story. Those are not implemented.
