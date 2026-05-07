const body = document.body;
const assetPrefix = body.dataset.assetPrefix || "";
const page = body.dataset.page || "";
const apiBase = `${assetPrefix}api`;
const AUTH_TOKEN_KEY = "libretasroca_admin_token";

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
      return `
        <article class="admin-card">
          <div class="admin-card-content">
            <img src="${resolveItemImage(item)}" alt="${item.nombre}" />
            <div>
              <h3>${item.nombre}</h3>
              <p>${item.descripcion || "Sin descripción"}</p>
              <p><strong>Categoría:</strong> ${item.categoria || "-"}</p>
              <p><strong>Etiqueta:</strong> ${item.etiqueta || "-"}</p>
            </div>
          </div>
          <button class="btn btn-ghost admin-delete" type="button" data-delete-id="${item.id}">Eliminar</button>
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

async function loadAdminItems() {
  const message = document.querySelector("[data-admin-message]");
  try {
    const items = await fetchItems();
    renderAdminItems(items);
    setMessage(message, "", "info");
  } catch (error) {
    renderAdminItems([]);
    setMessage(message, error.message, "error");
  }
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
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;
    const itemId = button.dataset.deleteId;

    try {
      await deleteItem(itemId);
      await loadAdminItems();
      setMessage(message, "Modelo eliminado correctamente", "info");
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(message, "", "info");

    const formData = new FormData(form);
    const nombre = formData.get("nombre")?.toString().trim();
    const categoria = formData.get("categoria")?.toString().trim();
    const etiqueta = formData.get("etiqueta")?.toString().trim();
    const formato = formData.get("formato")?.toString().trim();
    const descripcion = formData.get("descripcion")?.toString().trim();
    const imagenFile = formData.get("imagen");

    try {
      if (!nombre || !categoria || !etiqueta || !descripcion) {
        throw new Error("Completa todos los campos obligatorios");
      }

      let imagen_key = null;
      if (imagenFile && imagenFile.size > 0) {
        imagen_key = await uploadImage(imagenFile);
      }

      await createModel({
        nombre,
        categoria,
        etiqueta,
        formato,
        descripcion,
        imagen_key,
      });

      form.reset();
      await loadAdminItems();
      setMessage(message, "Modelo creado correctamente", "info");
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
