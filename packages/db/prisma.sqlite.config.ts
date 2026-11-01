import { defineConfig } from "prisma/config";
import { demoDatabaseUrl } from "./demo-database.mjs";

export default defineConfig({
  schema: "prisma/schema.sqlite.prisma",
  migrations: {
    path: "prisma/migrations-sqlite",
  },
  datasource: {
    url: demoDatabaseUrl(),
  },
});
