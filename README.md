# Libretas Roca — Business Website & Reusable Template

**Live site:** [libretasroca.com](https://libretasroca.com)

A full-stack business website built and deployed for a real small business client — an ecological handmade notebook brand based in Mexico. Designed from the ground up as a reusable template that any developer can fork and adapt for similar small business use cases.

---

## 🌟 Features

- **Product Catalog** — SQL database storing all notebook models, descriptions, and images, dynamically rendered on the frontend
- **Admin Panel** — secure login screen with `.env`-based credential management, allowing the business owner to manage catalog content without touching code
- **Chatbot Proxy** — public chat widget that calls an n8n workflow through a secure Netlify Function
- **SEO Ready** — includes `robots.txt` and `sitemap.xml` for search engine indexing out of the box
- **Netlify Deployment** — configured with `netlify.toml` for continuous deployment; push to main and the site updates automatically
- **Reusable Architecture** — structured as a clean template so future projects can be bootstrapped quickly from this base

---

## 🛠️ Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend / Functions | Deno (Netlify Functions) |
| Database | SQL |
| Deployment | Netlify |
| Auth | Environment variable-based login |
| Automation | n8n webhook workflow |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- A [Netlify](https://netlify.com) account for deployment
- A `.env` file configured (see below)

### Installation

```bash
# Clone the repository
git clone https://github.com/AlexoBot/LibretasRocaSitio.git
cd LibretasRocaSitio

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_secure_password
ADMIN_AUTH_SECRET=your_random_auth_secret
N8N_CHAT_WEBHOOK_URL=https://your-n8n-domain/webhook/your-production-chat-webhook
N8N_CHAT_SECRET=your_shared_chat_secret
N8N_CHAT_TIMEOUT_MS=12000
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### n8n Chat Workflow

The public chatbot calls `/api/chat`, and that Netlify Function forwards messages to n8n. Configure the n8n workflow with:

- A Webhook Trigger using `POST`
- Header authentication with the header name `x-libretas-chat-secret`
- The same header value stored in Netlify as `N8N_CHAT_SECRET`
- A Respond to Webhook node that returns JSON:

```json
{
  "reply": "message for the visitor",
  "suggestions": ["Ver catalogo", "Pedido personalizado", "Contacto"]
}
```

Use the published production webhook URL as `N8N_CHAT_WEBHOOK_URL`. The browser should only call `/api/chat`; do not expose the n8n webhook URL in frontend code.

### Running Locally

```bash
# Using Netlify CLI for local dev (recommended)
npx netlify dev
```

### 🤖Agent Catalog API (`/api/libretas`)
---

The `/api/libretas` endpoint is a protected search endpoint designed for use by the __n8n__ AI agent. It allows the chatbot to query the product catalog with optional filters and return up to 10 matching items.

**Authentication**

All requests must include the `x-api-key` header. Set the key in your environment as `AGENT_SECRET_KEY`:

```env
AGENT_SECRET_KEY=your_secret_agent_key
```

**Query Parameters**

| Parameter | Description | Valid Values |
|-----------|-------------|--------------|
| `categoria` | Filter by category | `notas`, `agenda`, `dibujo`, `regalo` |
| `papel` | Filter by paper type | `Blanco`, `Liso`, `Rayado`, `Punteado`, `Negro`, `Colores` |
| `encuadernado` | Filter by binding type | `Pasta Dura`, `Espiral`, `Block` |
| `formato` | Filter by format/size | `Vertical`, `Horizontal`, `Profesional`, `Bolsillo`, `Mini` |
| `q` | Full-text search on name and description | Any string |

All parameters are optional. Omitting a parameter returns items regardless of that field's value.

**Example Request (n8n HTTP Request node)**

```
GET https://your-site.netlify.app/api/libretas?categoria=notas&papel=Rayado
Headers:
  x-api-key: your_secret_agent_key
```

**Example Response**

```json
[
  {
    "id": 1,
    "nombre": "Libreta Rayada Pequeña",
    "categoria": "notas",
    "papel": "Rayado",
    "formato": "Bolsillo",
    "encuadernado": "Espiral",
    "descripcion": "Libreta compacta para notas rápidas.",
    "imagen_key": "images/1234567890-abc.jpg",
    "created_at": "2026-05-10T12:00:00.000Z"
  }
]
```

**Implementation Note**

This endpoint uses `db` from `./item-table.js` (same `@netlify/database` connection as all other endpoints). Do not replace this with a direct `@netlify/neon` import — doing so risks connecting to a different database instance and returning empty results even when the table has data.

---

### Deployment

>⚠️ **Database Migrations Note:** The database migrations are hashed and locked by Netlify on first deployment. Once deployed, the original SQL migration files cannot be modified — any schema changes must be made as new migration files rather than editing existing ones.

The project deploys automatically to Netlify on every push to `main`. To set up your own deployment:

1. Fork this repository
2. Connect it to your Netlify account
3. Add your environment variables in the Netlify dashboard under **Site Settings → Environment Variables**
4. Deploy 🚀

---

## 📁 Project Structure

```
LibretasRocaSitio/
├── index.html          # Main entry point
├── Scripts.js          # Core frontend logic
├── Styles.css          # Global styles
├── admin.js            # Admin panel logic
├── Paginas/            # Additional pages
├── Fotos/              # Product images
├── netlify/            # Netlify serverless functions
├── netlify.toml        # Netlify deployment config
├── robots.txt          # SEO: search engine rules
├── sitemap.xml         # SEO: site structure for indexing
└── .gitignore
```

---

## 🎯 Use This as a Template

This repo was intentionally structured to be forked and reused. To adapt it for your own small business client:

1. Replace content in `index.html` and `Paginas/` with your client's info
2. Swap out `Fotos/` with your product images
3. Update the SQL schema to match your product catalog
4. Configure your own `.env` credentials
5. Connect to Netlify and deploy

---

## 📄 License

Open for inspiration and adaptation. If you use this as a base for your own project, a star ⭐ is always appreciated!
