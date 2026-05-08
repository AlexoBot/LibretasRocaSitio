import { getStore } from "@netlify/blobs";
import { requireAuth } from "./auth.js";
import { normalizeItemPayload, validateItemPayload } from "./item-schema.js";
import { db, ensureItemsTable } from "./item-table.js";

export default async (req, context) => {
  const id = parseInt(context.params.id, 10);

  if (isNaN(id)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  if (req.method === "GET") {
    await ensureItemsTable();
    const [item] = await db.sql`SELECT * FROM items WHERE id = ${id}`;
    if (!item) {
      return Response.json({ error: "Item no encontrado" }, { status: 404 });
    }
    return Response.json(item);
  }

  if (req.method === "PUT") {
    try {
      requireAuth(req);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return Response.json(
        { error: "Cuerpo de solicitud inválido" },
        { status: 400 }
      );
    }

    const itemData = normalizeItemPayload(body);
    const validationError = validateItemPayload(itemData, { partial: true });

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { nombre, categoria, papel, formato, encuadernado, descripcion, imagen_key } = itemData;
    await ensureItemsTable();

    const [previousItem] = await db.sql`SELECT imagen_key FROM items WHERE id = ${id}`;

    if (!previousItem) {
      return Response.json({ error: "Item no encontrado" }, { status: 404 });
    }

    const [item] = await db.sql`
      UPDATE items
      SET nombre      = COALESCE(${nombre ?? null}, nombre),
          categoria   = COALESCE(${categoria ?? null}, categoria),
          papel       = COALESCE(${papel ?? null}, papel),
          formato     = COALESCE(${formato ?? null}, formato),
          encuadernado = COALESCE(${encuadernado ?? null}, encuadernado),
          descripcion = COALESCE(${descripcion ?? null}, descripcion),
          imagen_key  = COALESCE(${imagen_key ?? null}, imagen_key)
      WHERE id = ${id}
      RETURNING *
    `;

    if (imagen_key && previousItem.imagen_key && previousItem.imagen_key !== imagen_key) {
      const store = getStore("item-images");
      await store.delete(previousItem.imagen_key).catch((error) => {
        console.error("No se pudo eliminar la imagen anterior", error);
      });
    }

    return Response.json(item);
  }

  if (req.method === "DELETE") {
    try {
      requireAuth(req);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    await ensureItemsTable();

    const [item] = await db.sql`SELECT imagen_key FROM items WHERE id = ${id}`;
    if (!item) {
      return Response.json({ error: "Item no encontrado" }, { status: 404 });
    }

    await db.sql`DELETE FROM items WHERE id = ${id}`;

    if (item.imagen_key) {
      const store = getStore("item-images");
      await store.delete(item.imagen_key).catch((error) => {
        console.error("No se pudo eliminar la imagen del modelo eliminado", error);
      });
    }

    return new Response(null, { status: 204 });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = {
  path: "/api/items/:id",
};
