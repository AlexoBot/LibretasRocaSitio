import { neon } from '@netlify/neon'
 
export default async (req) => {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.AGENT_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
 
  const sql = neon()
 
  const url = new URL(req.url)
  const p = url.searchParams
 
  const tipo_papel    = p.get('tipo_papel')    || null
  const tamano        = p.get('tamano')         || null
  const tapa          = p.get('tapa')           || null
  const encuadernacion = p.get('encuadernacion') || null
  const precio_max    = p.get('precio_max')     ? Number(p.get('precio_max')) : null
  const tag           = p.get('tag')            ? `%${p.get('tag')}%` : null
 
  try {
    const libretas = await sql.query(
      `SELECT * FROM libretas
       WHERE disponibilidad = 'en_stock'
         AND ($1::text IS NULL OR tipo_papel = $1)
         AND ($2::text IS NULL OR tamano = $2)
         AND ($3::text IS NULL OR tapa = $3)
         AND ($4::text IS NULL OR encuadernacion = $4)
         AND ($5::numeric IS NULL OR precio <= $5)
         AND ($6::text IS NULL OR tags ILIKE $6)
       ORDER BY nombre ASC
       LIMIT 10`,
      [tipo_papel, tamano, tapa, encuadernacion, precio_max, tag]
    )
 
    return new Response(JSON.stringify(libretas.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error al consultar la base de datos', detail: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
 
export const config = { path: '/api/libretas' }