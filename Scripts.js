/*
  Libretas Roca - Scripts principales
  -----------------------------------
  Para personalizar rápido:
  1. Cambia INSTAGRAM_URL por el perfil real de Instagram.
  2. Cambia CONTACT_EMAIL por el correo real.
  3. Agrega nuevos modelos desde el panel administrativo; el catálogo se carga desde la base de datos.
*/

const INSTAGRAM_URL = "https://www.instagram.com/libretasecologicasroca/";
const CONTACT_EMAIL = "contacto@libretasroca.com";

let catalogItems = [];
const body = document.body;
const assetPrefix = body.dataset.assetPrefix || "";
const page = body.dataset.page || "home";
const apiBase = `${assetPrefix}api`;

function productImagePath(product) {
  if (product?.imagen_key) {
    return `${apiBase}/get-image?key=${encodeURIComponent(product.imagen_key)}`;
  }
  return `${assetPrefix}Fotos/Modelos/libreta-minimal.svg`;
}

async function fetchCatalogItems() {
  try {
    const response = await fetch(`${apiBase}/items`);
    if (!response.ok) {
      throw new Error(`Error al cargar catálogo: ${response.status}`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) {
      throw new Error("Respuesta de catálogo inválida");
    }

    catalogItems = items;
  } catch (error) {
    console.error(error);
    catalogItems = [];
  }
}

function initHeader() {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");

  if (!header || !menu || !toggle) return;

  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initGlobalLinks() {
  document.querySelectorAll(".instagram-link").forEach((link) => {
    link.href = INSTAGRAM_URL;
  });

  document.querySelectorAll("a[href='mailto:contacto@libretasroca.com']").forEach((link) => {
    link.href = `mailto:${CONTACT_EMAIL}`;
    if (link.textContent.trim() === "contacto@libretasroca.com") {
      link.textContent = CONTACT_EMAIL;
    }
  });

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

function createProductCard(product, index) {
  const button = document.createElement("button");
  button.className = "catalog-card reveal is-visible";
  button.type = "button";
  button.dataset.category = product.categoria;
  button.dataset.productIndex = String(index);
  button.innerHTML = `
    <img src="${productImagePath(product)}" alt="${product.nombre} - ${product.etiqueta}" loading="lazy">
    <div class="catalog-card-body">
      <span class="catalog-tag">${product.etiqueta}</span>
      <h3>${product.nombre}</h3>
      <p>${product.descripcion}</p>
    </div>
  `;
  return button;
}

function renderCatalog(filter = "todos") {
  const catalogGrid = document.getElementById("catalogGrid");
  if (!catalogGrid) return;

  catalogGrid.innerHTML = "";

  const filteredProducts = filter === "todos"
    ? catalogItems
    : catalogItems.filter((product) => product.categoria === filter);

  filteredProducts.forEach((product) => {
    const originalIndex = catalogItems.indexOf(product);
    catalogGrid.appendChild(createProductCard(product, originalIndex));
  });

  if (!filteredProducts.length) {
    const emptyState = document.createElement("p");
    emptyState.textContent = "No hay modelos en esta categoría todavía.";
    catalogGrid.appendChild(emptyState);
  }
}

async function initCatalogFilters() {
  if (page !== "catalog") return;

  const filterButtons = document.querySelectorAll("[data-filter]");
  await fetchCatalogItems();
  renderCatalog();

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");
      renderCatalog(button.dataset.filter);
    });
  });
}

function initCatalogModal() {
  const modal = document.querySelector("[data-modal]");
  const catalogGrid = document.getElementById("catalogGrid");
  if (!modal || !catalogGrid) return;

  const modalImage = modal.querySelector("[data-modal-image]");
  const modalTitle = modal.querySelector("[data-modal-title]");
  const modalCategory = modal.querySelector("[data-modal-category]");
  const modalDescription = modal.querySelector("[data-modal-description]");
  const closeButtons = modal.querySelectorAll("[data-close-modal]");

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  const openModal = (product) => {
    modalImage.src = productImagePath(product);
    modalImage.alt = product.nombre;
    modalTitle.textContent = product.nombre;
    modalCategory.textContent = product.etiqueta;
    modalDescription.textContent = product.descripcion;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  catalogGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-product-index]");
    if (!card) return;
    const product = catalogItems[Number(card.dataset.productIndex)];
    if (product) openModal(product);
  });

  closeButtons.forEach((button) => button.addEventListener("click", closeModal));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const nombre = formData.get("nombre");
    const correo = formData.get("correo");
    const mensaje = formData.get("mensaje");

    const subject = encodeURIComponent(`Consulta desde libretasroca.com - ${nombre}`);
    const body = encodeURIComponent(
      `Nombre: ${nombre}\nCorreo: ${correo}\n\nMensaje:\n${mensaje}`
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
}

initHeader();
initGlobalLinks();
initRevealAnimations();
initCatalogFilters();
initCatalogModal();
initContactForm();
