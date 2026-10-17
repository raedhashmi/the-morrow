import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Falls back to "" so `prisma generate` (postinstall) works without a database.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
