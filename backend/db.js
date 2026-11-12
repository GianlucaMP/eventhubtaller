import pg from 'pg'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el entorno')
}

const connectionString = process.env.DATABASE_URL.replace(
  'sslmode=require',
  'sslmode=verify-full'
)

const pool = new Pool({ connectionString })

export default pool
