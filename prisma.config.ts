import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // env('DATABASE_URL') throws at config-load if the var is missing (breaks
    // `prisma generate` in postinstall/CI). Fallback keeps generate working;
    // db:push/migrate still get the real URL via dotenv.
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
})
