import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
