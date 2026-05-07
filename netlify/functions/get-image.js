import { getStore } from "@netlify/blobs";

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Método no permitido", { status: 405 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return Response.json({ error: "Parámetro 'key' requerido" }, { status: 400 });
  }

  const store = getStore("item-images");
  const blob = await store.get(key, { type: "blob" });

  if (!blob) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  const ext = key.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

  return new Response(blob, {
    headers: { "Content-Type": contentType },
  });
};

export const config = {
  path: "/api/get-image",
};
