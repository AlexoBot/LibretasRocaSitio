import { getStore } from "@netlify/blobs";
import { requireAuth } from "./auth.js";

const ALLOWED_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  try {
    requireAuth(req);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  const mimeType = contentType.split(";")[0].trim().toLowerCase();

  if (!ALLOWED_MIME_TYPES[mimeType]) {
    return Response.json(
      { error: "Tipo de imagen no soportado. Permitidos: jpg, jpeg, png, gif, webp" },
      { status: 400 }
    );
  }

  const ext = ALLOWED_MIME_TYPES[mimeType];
  const key = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const store = getStore("item-images");
  const buffer = await req.arrayBuffer();
  await store.set(key, buffer);

  return Response.json({ key }, { status: 201 });
};

export const config = {
  path: "/api/upload-image",
};
