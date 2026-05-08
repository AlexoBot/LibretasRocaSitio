CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  papel TEXT,
  formato TEXT,
  encuadernado TEXT,
  descripcion TEXT,
  imagen_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
