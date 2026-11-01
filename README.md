# StockWise

StockWise is a local inventory workspace for tracking products, stock levels, and stock movements. It is a portfolio project aimed at developers and technical reviewers who want to see a small, typed monorepo with a React interface and an Express API backed by MySQL.

It runs on your machine. The same process can also be hosted on Railway as one web service in front of a private MySQL database. Nothing is deployed yet.

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

The browser does not talk to MySQL. In development, Vite (port `5173`) proxies `/api` and `/health` to the API (port `3001`). In production, Express serves the built UI from `apps/web/dist` on the same host and port as the API, so those relative paths stay the same. The API uses `DATABASE_URL` from the process environment when it is already set, and otherwise reads it from `packages/db/.env`. Prisma connects with the MariaDB driver adapter.

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

The API reads `DATABASE_URL` from the process environment when that variable is already set, and otherwise from `packages/db/.env`. It listens on `0.0.0.0` and on `PORT`, or on port `3001` when `PORT` is unset. `http://localhost:3001` still reaches a local process. The `PORT` line in `.env.example` documents the local default. It is not loaded from `packages/db/.env`.

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

## Deployment

StockWise is set up for one Railway web service plus a private Railway MySQL database. This repository does not create that project, and the app is not deployed.

Production uses two root scripts:

| Script | What it does |
|---|---|
| `pnpm build` | Generates the Prisma client, then builds the React app into `apps/web/dist`. |
| `pnpm start` | Applies the committed migrations with `prisma migrate deploy`, then starts Express. |

`tsx`, `prisma`, and `dotenv` are production dependencies so the start command can run when devDependencies are omitted. The UI build still needs the web package's devDependencies (Vite and TypeScript), so install them during the build.

### Railway

1. Create a Railway project and add MySQL. Leave the database on the private network. Do not enable public database access.
2. Add one web service from this repository. Set its root directory to the repository root, not `apps/api`.
3. On the web service, set `DATABASE_URL` to the MySQL service's private connection URL. In Railway that reference is usually `${{MySQL.MYSQL_URL}}`. Use the variable name Railway shows for the plugin. Do not paste `packages/db/.env` or any local password. Do not set `PORT`. Railway injects it, and the server binds to `0.0.0.0`.
4. Build command: `pnpm build`
5. Start command: `pnpm start`
6. Health check path: `/health`

Use Node.js 22.14 or newer. Leave `NODE_ENV` unset on the service. Setting it to `production` during install can skip Vite and TypeScript, which the web build needs.

`pnpm build` does not connect to MySQL. `pnpm start` does: `prisma migrate deploy` runs at process start, when Railway's private hostname is reachable. The committed migration is `20261027133059_add_inventory`. Deploy does not create new migrations and does not reset existing tables.

Open the service URL after deploy. `/` is the built UI. `/health` returns `{ "service": "stockwise", "status": "ok" }`.

The public API has no authentication. Use a new Railway database, keep MySQL private, and treat the inventory data as shared and disposable.

### Production start on your machine

Build first, then start the API without running a migration:

```powershell
pnpm build
pnpm start:api
```

- UI and API: http://localhost:3001
- Health: http://localhost:3001/health

`pnpm dev:web` and `pnpm dev:api` stay the local development commands. The Vite proxy is unchanged.

`pnpm start` also runs `prisma migrate deploy` before the server. Run that only against the database you intend to migrate.

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
pnpm build
pnpm build:web
pnpm --filter @stockwise/web lint
pnpm db:validate
```

- `pnpm typecheck` runs TypeScript in `apps/web`, `apps/api`, `packages/db`, and `packages/shared`.
- `pnpm build` generates the Prisma client and then runs `pnpm build:web`.
- `pnpm build:web` typechecks the UI and produces a Vite production build.
- `pnpm --filter @stockwise/web lint` runs oxlint on the UI.
- `pnpm db:validate` checks `schema.prisma`. It does not prove that MySQL accepted a connection.

During development, `pnpm typecheck` and `pnpm build:web` completed successfully. Product create, read, update, and delete, stock in and stock out, insufficient stock, and the dashboard were exercised manually against a local MySQL database. The UI was opened against the Vite dev server and the same API.

`pnpm typecheck` and `pnpm build` were run again after the Railway hosting changes. A local production process was then started with `pnpm start:api` on port `3099` (port `3001` was already in use). It bound to `0.0.0.0`, served the built UI at `/`, returned JSON from `/health`, `/api/products`, and `/api/dashboard`, and returned a JSON `404` for an unknown `/api` path. `pnpm start` was not run, so `prisma migrate deploy` was not applied to the local database.

## Limitations and possible next steps

- No authentication, roles, or multi-user accounts. A public Railway URL exposes the same write API.
- Prepared for Railway, and not hosted anywhere yet. There is no CI workflow.
- No automated test suite.
- Movement history cannot be edited or reversed. The only correction is another movement.
- Products with history cannot be deleted from the API.
- The dashboard endpoint does not include movement rows. The UI loads those separately.
- The API reads only `DATABASE_URL` from `packages/db/.env`. Other keys in that file are ignored.
- One local MySQL database is assumed. There is no file import, barcode flow, or warehouse transfer model.

Reasonable follow-ups are an automated API test suite, authenticated users, and editable movement notes. Those are not implemented.
