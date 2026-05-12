# Libretas Roca — Business Website & Reusable Template

**Live site:** [libretasroca.com](https://libretasroca.com)

A full-stack business website built and deployed for a real small business client — an ecological handmade notebook brand based in Mexico. Designed from the ground up as a reusable template that any developer can fork and adapt for similar small business use cases.

---

## 🌟 Features

- **Product Catalog** — SQL database storing all notebook models, descriptions, and images, dynamically rendered on the frontend
- **Admin Panel** — secure login screen with `.env`-based credential management, allowing the business owner to manage catalog content without touching code
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
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
DB_CONNECTION=your_database_connection_string
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### Running Locally

```bash
# Using Netlify CLI for local dev (recommended)
npx netlify dev
```

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
