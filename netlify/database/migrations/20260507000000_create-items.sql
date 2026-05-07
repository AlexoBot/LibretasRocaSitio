CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  etiqueta TEXT,
  formato TEXT,
  descripcion TEXT,
  imagen_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
