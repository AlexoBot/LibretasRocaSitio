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
 
  const categoria = p.get('categoria') || null
  const etiqueta  = p.get('etiqueta')  || null
  const formato   = p.get('formato')   || null
  const busqueda  = p.get('q')         ? `%${p.get('q')}%` : null
 
  try {
    const result = await sql.query(
      `SELECT * FROM items
       WHERE ($1::text IS NULL OR categoria = $1)
         AND ($2::text IS NULL OR etiqueta = $2)
         AND ($3::text IS NULL OR formato = $3)
         AND ($4::text IS NULL OR nombre ILIKE $4 OR descripcion ILIKE $4)
       ORDER BY nombre ASC
       LIMIT 10`,
      [categoria, etiqueta, formato, busqueda]
    )
 
    return new Response(JSON.stringify(result.rows), {
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