import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import { migrate } from 'drizzle-orm/bun-sql/migrator'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = new SQL(process.env.DATABASE_URL)
const db = drizzle(client)

await migrate(db, { migrationsFolder: 'drizzle' })
await client.close()

console.log('Migrations complete')
