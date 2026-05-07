import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";

const db = getDatabase();

export default async (req, context) => {
  const id = parseInt(context.params.id, 10);

  if (isNaN(id)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  if (req.method === "GET") {
    const [item] = await db.sql`SELECT * FROM items WHERE id = ${id}`;
    if (!item) {
      return Response.json({ error: "Item no encontrado" }, { status: 404 });
    }
    return Response.json(item);
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const { nombre, categoria, etiqueta, formato, descripcion, imagen_key } = body;

    const [item] = await db.sql`
      UPDATE items
      SET nombre      = COALESCE(${nombre ?? null}, nombre),
          categoria   = COALESCE(${categoria ?? null}, categoria),
          etiqueta    = COALESCE(${etiqueta ?? null}, etiqueta),
          formato     = COALESCE(${formato ?? null}, formato),
          descripcion = COALESCE(${descripcion ?? null}, descripcion),
          imagen_key  = COALESCE(${imagen_key ?? null}, imagen_key)
      WHERE id = ${id}
      RETURNING *
    `;

    if (!item) {
      return Response.json({ error: "Item no encontrado" }, { status: 404 });
    }

    return Response.json(item);
  }

  if (req.method === "DELETE") {
    const [item] = await db.sql`SELECT imagen_key FROM items WHERE id = ${id}`;
    if (!item) {
      return Response.json({ error: "Item no encontrado" }, { status: 404 });
    }

    if (item.imagen_key) {
      const store = getStore("item-images");
      await store.delete(item.imagen_key);
    }

    await db.sql`DELETE FROM items WHERE id = ${id}`;
    return new Response(null, { status: 204 });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = {
  path: "/api/items/:id",
};
