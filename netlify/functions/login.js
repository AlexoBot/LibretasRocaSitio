import { verifyCredentials, createAuthToken } from "./auth.js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.email || !body.password) {
    return Response.json(
      { error: "Correo y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  const { email, password } = body;
  const valid = verifyCredentials(email, password);
  if (!valid) {
    return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const token = createAuthToken(email);
  return Response.json({ token });
};

export const config = {
  path: "/api/login",
};
