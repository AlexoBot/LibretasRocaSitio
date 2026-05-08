import { getDatabase } from "@netlify/database";
import { requireAuth } from "./auth.js";
import { normalizeItemPayload, validateItemPayload } from "./item-schema.js";

const db = getDatabase();

export default async (req) => {
  if (req.method === "GET") {
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

    const [item] = await db.sql`
      INSERT INTO items (nombre, categoria, papel, formato, encuadernado, descripcion, imagen_key)
      VALUES (${nombre}, ${categoria}, ${papel}, ${formato}, ${encuadernado}, ${descripcion}, ${imagen_key})
      RETURNING *
    `;

    return Response.json(item, { status: 201 });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = {
  path: "/api/items",
};
