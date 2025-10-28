import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env.local file only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.PRISMA_DATABASE_URL!,
  },
});
