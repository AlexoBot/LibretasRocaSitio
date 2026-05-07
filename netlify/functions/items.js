import { getDatabase } from "@netlify/database";
import { requireAuth } from "./auth.js";

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

    const body = await req.json();
    const { nombre, categoria, etiqueta, formato, descripcion, imagen_key } = body;

    if (!nombre) {
      return Response.json(
        { error: "El campo 'nombre' es obligatorio" },
        { status: 400 }
      );
    }

    const [item] = await db.sql`
      INSERT INTO items (nombre, categoria, etiqueta, formato, descripcion, imagen_key)
      VALUES (${nombre}, ${categoria ?? null}, ${etiqueta ?? null}, ${formato ?? null}, ${descripcion ?? null}, ${imagen_key ?? null})
      RETURNING *
    `;

    return Response.json(item, { status: 201 });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = {
  path: "/api/items",
};
