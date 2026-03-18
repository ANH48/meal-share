import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // @ts-expect-error adapter is supported at runtime in Prisma 7 for SSL
    adapter: new PrismaPg({
      connectionString: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    }),
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
