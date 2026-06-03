const CHAT_HEADER_NAME = "x-libretas-chat-secret";
const DEFAULT_TIMEOUT_MS = 12000;

function normalizeEnv(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.replace(/^(["'])(.*)\1$/, "$2");
}

function parseTimeout(value) {
  const timeout = Number.parseInt(normalizeEnv(value), 10);
  if (!Number.isFinite(timeout) || timeout < 1000) {
    return DEFAULT_TIMEOUT_MS;
  }
  return timeout;
}

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizePage(page = {}) {
  if (!page || typeof page !== "object") {
    return {};
  }

  return {
    type: normalizeText(page.type),
    url: normalizeText(page.url),
    title: normalizeText(page.title),
  };
}

function normalizeSuggestions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((suggestion) => typeof suggestion === "string")
    .map((suggestion) => suggestion.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function pickReply(payload) {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const reply = pickReply(item);
      if (reply) return reply;
    }
    return "";
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directReply = payload.reply
    || payload.answer
    || payload.message
    || payload.text
    || payload.output
    || payload.response;

  if (typeof directReply === "string" && directReply.trim()) {
    return directReply.trim();
  }

  return pickReply(payload.data) || pickReply(payload.json);
}

function pickSuggestions(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const suggestions = pickSuggestions(item);
      if (suggestions.length) return suggestions;
    }
    return [];
  }

  const suggestions = normalizeSuggestions(payload.suggestions);
  const quickReplies = normalizeSuggestions(payload.quickReplies);

  if (suggestions.length) return suggestions;
  if (quickReplies.length) return quickReplies;

  return pickSuggestions(payload.data).concat(pickSuggestions(payload.json)).slice(0, 4);
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Metodo no permitido", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const webhookUrl = normalizeEnv(process.env.N8N_CHAT_WEBHOOK_URL);
  const webhookSecret = normalizeEnv(process.env.N8N_CHAT_SECRET);
  const timeoutMs = parseTimeout(process.env.N8N_CHAT_TIMEOUT_MS);

  if (!webhookUrl || !webhookSecret) {
    return json({ error: "El chat no esta configurado todavia." }, 500);
  }

  const body = await req.json().catch(() => null);
  const message = normalizeText(body?.message);

  if (!message) {
    return json({ error: "El mensaje es obligatorio." }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CHAT_HEADER_NAME]: webhookSecret,
      },
      body: JSON.stringify({
        message,
        sessionId: normalizeText(body?.sessionId),
        page: normalizePage(body?.page),
      }),
      signal: controller.signal,
    });

    if (!n8nResponse.ok) {
      console.error("n8n chat webhook failed", n8nResponse.status);
      return json({ error: "No pudimos conectar con el chat. Intenta de nuevo en un momento." }, 502);
    }

    const payload = await n8nResponse.json().catch(() => null);
    const reply = pickReply(payload);

    if (!reply) {
      console.error("n8n chat webhook returned an invalid payload");
      return json({ error: "El chat no pudo generar una respuesta." }, 502);
    }

    return json({
      reply,
      suggestions: pickSuggestions(payload),
    });
  } catch (error) {
    console.error("n8n chat webhook error", error);
    return json({ error: "No pudimos conectar con el chat. Intenta de nuevo en un momento." }, 502);
  } finally {
    clearTimeout(timeout);
  }
};

export const config = {
  path: "/api/chat",
};
