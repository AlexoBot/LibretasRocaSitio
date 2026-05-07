import crypto from "crypto";

function normalizeEnv(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^(["'])(.*)\1$/, "$2");
  return unquoted;
}

const ADMIN_EMAIL = normalizeEnv(process.env.ADMIN_EMAIL);
const ADMIN_PASSWORD = normalizeEnv(process.env.ADMIN_PASSWORD);
const ADMIN_AUTH_SECRET = normalizeEnv(process.env.ADMIN_AUTH_SECRET);
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 4; // 4 horas

function ensureAuthConfig() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_AUTH_SECRET) {
    throw new Error("Configuración de autenticación incompleta");
  }
}

function createHash(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function verifyCredentials(email, password) {
  ensureAuthConfig();
  if (!email || !password) {
    return false;
  }

  const providedEmailHash = createHash(email.trim().toLowerCase());
  const expectedEmailHash = createHash(ADMIN_EMAIL.trim().toLowerCase());
  const providedPasswordHash = createHash(password);
  const expectedPasswordHash = createHash(ADMIN_PASSWORD);

  return safeEqual(providedEmailHash, expectedEmailHash) && safeEqual(providedPasswordHash, expectedPasswordHash);
}

export function createAuthToken(email) {
  ensureAuthConfig();
  const payload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_AUTH_SECRET)
    .update(encoded, "utf8")
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyAuthToken(token) {
  ensureAuthConfig();
  if (!token || typeof token !== "string") {
    throw new Error("Token inválido");
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Token mal formado");
  }

  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_AUTH_SECRET)
    .update(encoded, "utf8")
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error("Token inválido");
  }

  const payloadJson = Buffer.from(encoded, "base64url").toString("utf8");
  const payload = JSON.parse(payloadJson);
  if (!payload || typeof payload !== "object" || !payload.exp || payload.exp < Date.now()) {
    throw new Error("Token expirado o inválido");
  }

  return payload;
}

export function requireAuth(req) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) {
    throw new Error("No autorizado");
  }

  const token = header.split(" ")[1];
  return verifyAuthToken(token);
}
