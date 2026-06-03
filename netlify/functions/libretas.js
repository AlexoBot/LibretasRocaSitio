import { neon } from '@netlify/neon'

export default async (req) => {
  // Validación de API Key
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.AGENT_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Conexión a Netlify DB (usa NETLIFY_DATABASE_URL automáticamente)
  const sql = neon()

  const url = new URL(req.url)
  const p = url.searchParams

  // Query base: solo productos en stock
  let query = `SELECT * FROM libretas WHERE disponibilidad = 'en_stock'`
  const values = []

  // Filtros opcionales
  if (p.get('tipo_papel')) {
    values.push(p.get('tipo_papel'))
    query += ` AND tipo_papel = $${values.length}`
  }

  if (p.get('tamano')) {
    values.push(p.get('tamano'))
    query += ` AND tamano = $${values.length}`
  }

  if (p.get('tapa')) {
    values.push(p.get('tapa'))
    query += ` AND tapa = $${values.length}`
  }

  if (p.get('encuadernacion')) {
    values.push(p.get('encuadernacion'))
    query += ` AND encuadernacion = $${values.length}`
  }

  if (p.get('precio_max')) {
    values.push(Number(p.get('precio_max')))
    query += ` AND precio <= $${values.length}`
  }

  if (p.get('tag')) {
    values.push(`%${p.get('tag')}%`)
    query += ` AND tags ILIKE $${values.length}`
  }

  query += ' ORDER BY nombre ASC LIMIT 10'

  try {
    const libretas = await sql(query, values)

    return new Response(JSON.stringify(libretas), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al consultar la base de datos', detail: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = { path: '/api/libretas' }