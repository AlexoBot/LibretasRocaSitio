import { db } from './item-table.js'

export default async (req) => {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.AGENT_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const p = url.searchParams

  const categoria    = p.get('categoria')    || null
  const papel        = p.get('papel')        || null
  const encuadernado = p.get('encuadernado') || null
  const formato      = p.get('formato')      || null
  const busqueda     = p.get('q')            ? `%${p.get('q')}%` : null

  try {
    const items = await db.sql`
      SELECT * FROM items
      WHERE (${categoria}::text IS NULL OR categoria = ${categoria})
        AND (${papel}::text IS NULL OR papel = ${papel})
        AND (${encuadernado}::text IS NULL OR encuadernado = ${encuadernado})
        AND (${formato}::text IS NULL OR formato = ${formato})
        AND (${busqueda}::text IS NULL OR nombre ILIKE ${busqueda} OR descripcion ILIKE ${busqueda})
      ORDER BY nombre ASC
      LIMIT 10
    `

    return new Response(JSON.stringify(items), {
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
