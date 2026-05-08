const body = document.body;
const assetPrefix = body.dataset.assetPrefix || "";
const page = body.dataset.page || "";
const apiBase = `${assetPrefix}api`;
const AUTH_TOKEN_KEY = "libretasroca_admin_token";
let adminItems = [];
let editingItemId = null;
const CATEGORY_LABELS = {
  notas: "Notas",
  agenda: "Agenda",
  dibujo: "Dibujo",
  regalo: "Regalo",
};

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "-";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function findItemById(itemId) {
  return adminItems.find((item) => String(item.id) === String(itemId));
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function saveToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setMessage(target, text, type = "info") {
  if (!target) return;
  target.textContent = text;
  target.classList.toggle("error", type === "error");
}

function initGlobalUI() {
  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });
}

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  elements.forEach((element) => observer.observe(element));
}

async function loginRequest(email, password) {
  const response = await fetch(`${apiBase}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "No se pudo iniciar sesión");
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("Respuesta de autenticación inválida");
  }

  saveToken(data.token);
}

async function fetchItems() {
  const response = await fetch(`${apiBase}/items`);
  if (!response.ok) {
    throw new Error("No se pudo cargar los modelos");
  }
  return response.json();
}

function resolveItemImage(item) {
  if (item.imagen_key) {
    return `${apiBase}/get-image?key=${encodeURIComponent(item.imagen_key)}`;
  }
  return `${assetPrefix}Fotos/Modelos/libreta-minimal.svg`;
}

function renderAdminItems(items = []) {
  const list = document.getElementById("adminItemList");
  if (!list) return;

  if (!items.length) {
    list.innerHTML = `<div class="admin-card"><p>No hay modelos registrados todavía.</p></div>`;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const isSelected = String(item.id) === String(editingItemId);
      const category = categoryLabel(item.categoria);
      const details = [category, item.papel, item.formato, item.encuadernado].filter(Boolean).join(" / ");

      return `
        <article class="admin-card${isSelected ? " is-selected" : ""}">
          <button class="admin-item-button" type="button" data-edit-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.nombre || "modelo")}">
            <img src="${escapeHtml(resolveItemImage(item))}" alt="${escapeHtml(item.nombre)}" />
            <div class="admin-card-content">
              <h3>${escapeHtml(item.nombre)}</h3>
              <p class="admin-card-description">${escapeHtml(item.descripcion || "Sin descripción")}</p>
              <p class="admin-card-meta">${escapeHtml(details || "-")}</p>
            </div>
          </button>
          <button class="btn btn-ghost admin-delete" type="button" data-delete-id="${escapeHtml(item.id)}">Eliminar</button>
        </article>
      `;
    })
    .join("");
}

async function deleteItem(itemId) {
  const response = await fetch(`${apiBase}/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "No se pudo eliminar el modelo");
  }
}

async function uploadImage(file) {
  const response = await fetch(`${apiBase}/upload-image`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "No se pudo subir la imagen");
  }

  const data = await response.json();
  return data.key;
}

async function createModel(itemData) {
  const response = await fetch(`${apiBase}/items`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "No se pudo crear el modelo");
  }

  return response.json();
}

async function updateModel(itemId, itemData) {
  const response = await fetch(`${apiBase}/items/${itemId}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "No se pudo actualizar el modelo");
  }

  return response.json();
}

async function loadAdminItems() {
  const message = document.querySelector("[data-admin-message]");
  try {
    adminItems = await fetchItems();
    if (editingItemId && !findItemById(editingItemId)) {
      editingItemId = null;
    }
    renderAdminItems(adminItems);
    setMessage(message, "", "info");
  } catch (error) {
    adminItems = [];
    renderAdminItems([]);
    setMessage(message, error.message, "error");
  }
}

function setSelectValue(form, name, value, fallback) {
  const field = form.elements[name];
  if (!field) return;

  field.value = value || fallback;
  if (!field.value) {
    field.value = fallback;
  }
}

function getFormItemData(form) {
  const formData = new FormData(form);
  return {
    nombre: formData.get("nombre")?.toString().trim(),
    categoria: formData.get("categoria")?.toString().trim(),
    papel: formData.get("papel")?.toString().trim(),
    formato: formData.get("formato")?.toString().trim(),
    encuadernado: formData.get("encuadernado")?.toString().trim(),
    descripcion: formData.get("descripcion")?.toString().trim(),
  };
}

function validateAdminItemData(itemData) {
  const requiredValues = [
    itemData.nombre,
    itemData.categoria,
    itemData.papel,
    itemData.formato,
    itemData.encuadernado,
    itemData.descripcion,
  ];

  if (requiredValues.some((value) => !value)) {
    throw new Error("Completa todos los campos obligatorios");
  }
}

function updateAdminImagePreview(item = null) {
  const preview = document.querySelector("[data-admin-image-preview]");
  const image = document.querySelector("[data-admin-image]");
  const label = document.querySelector("[data-admin-image-label]");
  if (!preview || !image || !label) return;

  if (!item) {
    preview.hidden = true;
    image.removeAttribute("src");
    return;
  }

  image.src = resolveItemImage(item);
  image.alt = `Portada de ${item.nombre}`;
  label.textContent = item.imagen_key ? "Portada actual" : "Sin portada subida";
  preview.hidden = false;
}

function setCreateMode(form) {
  const title = document.querySelector("[data-admin-form-title]");
  const note = document.querySelector("[data-admin-form-note]");
  const submit = document.querySelector("[data-admin-submit]");
  const cancel = document.querySelector("[data-cancel-edit]");

  editingItemId = null;
  form.reset();
  title.textContent = "Nuevo modelo";
  note.textContent = "Registra una libreta nueva en el catálogo.";
  submit.textContent = "Guardar modelo";
  cancel.hidden = true;
  updateAdminImagePreview(null);
  renderAdminItems(adminItems);
}

function setEditMode(form, item) {
  const title = document.querySelector("[data-admin-form-title]");
  const note = document.querySelector("[data-admin-form-note]");
  const submit = document.querySelector("[data-admin-submit]");
  const cancel = document.querySelector("[data-cancel-edit]");

  editingItemId = String(item.id);
  form.elements.nombre.value = item.nombre || "";
  setSelectValue(form, "categoria", item.categoria, "notas");
  setSelectValue(form, "papel", item.papel, "Blanco");
  setSelectValue(form, "formato", item.formato, "Vertical");
  setSelectValue(form, "encuadernado", item.encuadernado, "Pasta Dura");
  form.elements.descripcion.value = item.descripcion || "";
  form.elements.imagen.value = "";
  title.textContent = "Editar modelo";
  note.textContent = item.nombre || "Modelo seleccionado";
  submit.textContent = "Actualizar modelo";
  cancel.hidden = false;
  updateAdminImagePreview(item);
  renderAdminItems(adminItems);
}

function initLoginPage() {
  const form = document.querySelector("[data-login-form]");
  const message = document.querySelector("[data-login-message]");

  if (!form) return;
  if (getToken()) {
    window.location.href = "Admin.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(message, "", "info");

    const formData = new FormData(form);
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    try {
      if (!email || !password) {
        throw new Error("Completa correo y contraseña");
      }

      await loginRequest(email, password);
      window.location.href = "Admin.html";
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });
}

function initAdminPage() {
  const form = document.querySelector("[data-admin-form]");
  const message = document.querySelector("[data-admin-message]");
  const signOutButton = document.querySelector("[data-sign-out]");
  const cancelEditButton = document.querySelector("[data-cancel-edit]");
  const itemList = document.getElementById("adminItemList");

  if (!form || !itemList) return;
  if (!getToken()) {
    window.location.href = "Login.html";
    return;
  }

  signOutButton?.addEventListener("click", () => {
    clearToken();
    window.location.href = "Login.html";
  });

  itemList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) {
      event.preventDefault();
      const itemId = deleteButton.dataset.deleteId;

      try {
        deleteButton.disabled = true;
        deleteButton.textContent = "Eliminando...";
        await deleteItem(itemId);
        if (String(itemId) === String(editingItemId)) {
          setCreateMode(form);
        }
        await loadAdminItems();
        setMessage(message, "Modelo eliminado correctamente", "info");
      } catch (error) {
        deleteButton.disabled = false;
        deleteButton.textContent = "Eliminar";
        setMessage(message, error.message, "error");
      }
      return;
    }

    const editButton = event.target.closest("[data-edit-id]");
    if (editButton) {
      const item = findItemById(editButton.dataset.editId);
      if (!item) return;

      setEditMode(form, item);
      setMessage(message, "", "info");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  cancelEditButton?.addEventListener("click", () => {
    setCreateMode(form);
    setMessage(message, "", "info");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(message, "", "info");

    const formData = new FormData(form);
    const itemData = getFormItemData(form);
    const imagenFile = formData.get("imagen");

    try {
      validateAdminItemData(itemData);

      if (imagenFile && imagenFile.size > 0) {
        itemData.imagen_key = await uploadImage(imagenFile);
      }

      if (editingItemId) {
        const currentEditingId = editingItemId;
        await updateModel(currentEditingId, itemData);
        await loadAdminItems();

        const updatedItem = findItemById(currentEditingId);
        if (updatedItem) {
          setEditMode(form, updatedItem);
        }

        setMessage(message, "Modelo actualizado correctamente", "info");
      } else {
        await createModel({
          ...itemData,
          imagen_key: itemData.imagen_key || null,
        });

        setCreateMode(form);
        await loadAdminItems();
        setMessage(message, "Modelo creado correctamente", "info");
      }
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });

  loadAdminItems();
}

initGlobalUI();
initRevealAnimations();

if (page === "login") {
  initLoginPage();
}

if (page === "admin") {
  initAdminPage();
}
