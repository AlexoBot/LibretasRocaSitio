import { requireAuth } from "./auth.js";
import { normalizeItemPayload, validateItemPayload } from "./item-schema.js";
import { db, ensureItemsTable } from "./item-table.js";

export default async (req) => {
  if (req.method === "GET") {
    await ensureItemsTable();
    const items = await db.sql`SELECT * FROM items ORDER BY id`;
    return Response.json([...items]);
  }

  if (req.method === "POST") {
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
    const validationError = validateItemPayload(itemData);

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { nombre, categoria, papel, formato, encuadernado, descripcion, imagen_key } = itemData;

    try {
      await ensureItemsTable();

      const [item] = await db.sql`
        INSERT INTO items (nombre, categoria, papel, formato, encuadernado, descripcion, imagen_key)
        VALUES (${nombre}, ${categoria}, ${papel}, ${formato}, ${encuadernado}, ${descripcion}, ${imagen_key})
        RETURNING *
      `;

      return Response.json(item, { status: 201 });
    } catch (error) {
      console.error("No se pudo guardar el modelo", error);
      return Response.json(
        { error: "No se pudo guardar el modelo en la base de datos" },
        { status: 500 }
      );
    }
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = {
  path: "/api/items",
};
