const ITEM_OPTIONS = {
  categoria: ["notas", "agenda", "dibujo", "regalo"],
  papel: ["Blanco", "Liso", "Rayado", "Punteado", "Negro", "Colores"],
  formato: ["Vertical", "Horizontal", "Profesional", "Bolsillo", "Mini"],
  encuadernado: ["Pasta Dura", "Espiral", "Block"],
};

const REQUIRED_FIELDS = [
  "nombre",
  "categoria",
  "papel",
  "formato",
  "encuadernado",
  "descripcion",
];

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

export function normalizeItemPayload(body = {}) {
  return {
    nombre: normalizeText(body.nombre),
    categoria: normalizeText(body.categoria),
    papel: normalizeText(body.papel),
    formato: normalizeText(body.formato),
    encuadernado: normalizeText(body.encuadernado),
    descripcion: normalizeText(body.descripcion),
    imagen_key: normalizeText(body.imagen_key),
  };
}

export function validateItemPayload(item, { partial = false } = {}) {
  if (!partial) {
    const missingField = REQUIRED_FIELDS.find((field) => !item[field]);
    if (missingField) {
      return `El campo '${missingField}' es obligatorio`;
    }
  }

  const invalidField = Object.entries(ITEM_OPTIONS).find(([field, allowedValues]) => {
    return item[field] && !allowedValues.includes(item[field]);
  });

  if (invalidField) {
    const [field, allowedValues] = invalidField;
    return `El campo '${field}' debe ser uno de: ${allowedValues.join(", ")}`;
  }

  return null;
}
