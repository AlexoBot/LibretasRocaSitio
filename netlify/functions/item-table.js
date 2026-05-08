import { getDatabase } from "@netlify/database";

export const db = getDatabase();

let schemaReadyPromise = null;

async function prepareItemsTable() {
  await db.sql`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      categoria TEXT,
      papel TEXT,
      formato TEXT,
      encuadernado TEXT,
      descripcion TEXT,
      imagen_key TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS nombre TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS categoria TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS papel TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS formato TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS encuadernado TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS descripcion TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS imagen_key TEXT`;
  await db.sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`;
}

export async function ensureItemsTable() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = prepareItemsTable();
  }

  try {
    await schemaReadyPromise;
  } catch (error) {
    schemaReadyPromise = null;
    throw error;
  }
}
