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
const CHAT_SESSION_KEY = "libretasroca_chat_session_id";
const CHAT_DEFAULT_SUGGESTIONS = ["Ver catalogo", "Pedido personalizado", "Contacto"];

let catalogItems = [];
const body = document.body;
const assetPrefix = body.dataset.assetPrefix || "";
const page = body.dataset.page || "home";
const apiBase = `${assetPrefix}api`;
const CATEGORY_LABELS = {
  notas: "Notas",
  agenda: "Agenda",
  dibujo: "Dibujo",
  regalo: "Regalo",
};

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "";
}

function productDetails(product) {
  return [product.papel, product.formato, product.encuadernado].filter(Boolean).join(" / ");
}

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
  const category = categoryLabel(product.categoria);
  const details = productDetails(product);
  const button = document.createElement("button");
  button.className = "catalog-card reveal is-visible";
  button.type = "button";
  button.dataset.category = product.categoria;
  button.dataset.productIndex = String(index);
  button.innerHTML = `
    <img src="${productImagePath(product)}" alt="${product.nombre} - ${category}" loading="lazy">
    <div class="catalog-card-body">
      <span class="catalog-tag">${category}</span>
      <h3>${product.nombre}</h3>
      <p>${product.descripcion}</p>
      ${details ? `<p class="catalog-card-meta">${details}</p>` : ""}
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
  const modalDetails = modal.querySelector("[data-modal-details]");
  const closeButtons = modal.querySelectorAll("[data-close-modal]");

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  const openModal = (product) => {
    modalImage.src = productImagePath(product);
    modalImage.alt = product.nombre;
    modalTitle.textContent = product.nombre;
    modalCategory.textContent = categoryLabel(product.categoria);
    modalDescription.textContent = product.descripcion;
    if (modalDetails) {
      modalDetails.innerHTML = `
        <div><dt>Papel</dt><dd>${product.papel || "-"}</dd></div>
        <div><dt>Formato</dt><dd>${product.formato || "-"}</dd></div>
        <div><dt>Encuadernado</dt><dd>${product.encuadernado || "-"}</dd></div>
      `;
    }
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

function getChatSessionId() {
  const fallbackSessionId = `lr-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const existingSessionId = localStorage.getItem(CHAT_SESSION_KEY);
    if (existingSessionId) {
      return existingSessionId;
    }

    const sessionId = window.crypto?.randomUUID
      ? `lr-${window.crypto.randomUUID()}`
      : fallbackSessionId;

    localStorage.setItem(CHAT_SESSION_KEY, sessionId);
    return sessionId;
  } catch (error) {
    console.warn("No se pudo guardar la sesion del chat", error);
    return fallbackSessionId;
  }
}

function parseRichText(text) {
  // Escape HTML first to prevent XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Process line by line to handle lists
  const lines = escaped.split("\n");
  const result = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      result.push(`<ul>${listBuffer.map(li => `<li>${li}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  };

  for (const line of lines) {
    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      listBuffer.push(formatInline(listMatch[1]));
    } else {
      flushList();
      result.push(formatInline(line));
    }
  }
  flushList();

  return result.join("<br>")
    .replace(/<br>(<ul>)/g, "$1")
    .replace(/(<\/ul>)<br>/g, "$1");
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function createChatIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.9-.9L3 20.5l1.5-4.4A8.1 8.1 0 0 1 3 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  `;
}

function initChatWidget() {
  if (!["home", "catalog"].includes(page)) return;
  if (document.querySelector("[data-chat-widget]")) return;

  const sessionId = getChatSessionId();
  let isSending = false;
  let lastFailedMessage = "";

  const widget = document.createElement("div");
  widget.className = "chat-widget";
  widget.dataset.chatWidget = "";
  widget.innerHTML = `
    <section class="chat-panel" id="libretas-chat-panel" aria-label="Chat de Libretas Roca" hidden>
      <header class="chat-header">
        <div>
          <p class="chat-kicker">Libretas Roca</p>
          <h2>Asistente de pedidos</h2>
        </div>
        <button class="chat-close" type="button" aria-label="Cerrar chat" data-chat-close>&times;</button>
      </header>
      <div class="chat-messages" role="log" aria-live="polite" aria-relevant="additions" data-chat-messages></div>
      <div class="chat-suggestions" data-chat-suggestions></div>
      <form class="chat-form" data-chat-form>
        <label class="sr-only" for="chat-message-input">Mensaje para el chat</label>
        <textarea id="chat-message-input" name="message" rows="1" maxlength="700" placeholder="Pregunta por modelos, materiales o pedidos" data-chat-input></textarea>
        <button class="chat-send" type="submit" aria-label="Enviar mensaje" data-chat-send>Enviar</button>
      </form>
      <p class="chat-status" role="status" aria-live="polite" data-chat-status></p>
    </section>
    <button class="chat-bubble" type="button" aria-label="Abrir chat" aria-controls="libretas-chat-panel" aria-expanded="false" data-chat-toggle>
      ${createChatIcon()}
    </button>
  `;

  document.body.appendChild(widget);

  const panel = widget.querySelector(".chat-panel");
  const toggle = widget.querySelector("[data-chat-toggle]");
  const closeButton = widget.querySelector("[data-chat-close]");
  const form = widget.querySelector("[data-chat-form]");
  const input = widget.querySelector("[data-chat-input]");
  const sendButton = widget.querySelector("[data-chat-send]");
  const messages = widget.querySelector("[data-chat-messages]");
  const suggestions = widget.querySelector("[data-chat-suggestions]");
  const status = widget.querySelector("[data-chat-status]");

  const setStatus = (message = "", type = "info") => {
    status.textContent = message;
    status.classList.toggle("error", type === "error");
  };

  const setOpen = (open) => {
    widget.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar chat" : "Abrir chat");

    if (open) {
      panel.hidden = false;
      panel.classList.remove("chat-panel--closing");
      panel.classList.add("chat-panel--opening");
      setTimeout(() => input.focus(), 80);
    } else {
      panel.classList.remove("chat-panel--opening");
      panel.classList.add("chat-panel--closing");
      const onEnd = () => {
        panel.hidden = true;
        panel.classList.remove("chat-panel--closing");
        panel.removeEventListener("animationend", onEnd);
      };
      panel.addEventListener("animationend", onEnd);
    }
  };

  const setSending = (sending) => {
    isSending = sending;
    input.disabled = sending;
    sendButton.disabled = sending;
    suggestions.querySelectorAll("button").forEach((button) => {
      button.disabled = sending;
    });
  };

  const appendMessage = (type, text) => {
    const message = document.createElement("article");
    message.className = `chat-message chat-message-${type}`;

    const bubble = document.createElement("p");
    if (type === "bot") {
      bubble.innerHTML = parseRichText(text);
    } else {
      bubble.textContent = text;
    }
    message.appendChild(bubble);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  };

  const appendLoadingMessage = () => {
    const message = document.createElement("article");
    message.className = "chat-message chat-message-bot is-loading";
    const bubble = document.createElement("p");
    bubble.className = "chat-dots";
    bubble.innerHTML = "<span></span><span></span><span></span>";
    message.appendChild(bubble);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  };

  const renderSuggestions = (items = CHAT_DEFAULT_SUGGESTIONS) => {
    suggestions.innerHTML = "";

    items
      .filter(Boolean)
      .slice(0, 4)
      .forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item;
        button.addEventListener("click", () => {
          const message = item === "Reintentar" && lastFailedMessage
            ? lastFailedMessage
            : item;
          input.value = message;
          form.requestSubmit();
        });
        suggestions.appendChild(button);
      });
  };

  const sendMessage = async (message) => {
    const response = await fetch(`${apiBase}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId,
        page: {
          type: page,
          url: window.location.href,
          title: document.title,
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "No pudimos enviar tu mensaje.");
    }

    if (!payload.reply) {
      throw new Error("El chat no envio una respuesta valida.");
    }

    return payload;
  };

  const submitMessage = async (message) => {
    if (isSending) return;

    const text = message.trim();
    if (!text) {
      setStatus("Escribe una pregunta para iniciar el chat.", "error");
      input.focus();
      return;
    }

    setStatus("");
    appendMessage("user", text);
    input.value = "";
    setSending(true);

    const loadingMessage = appendLoadingMessage();

    try {
      const payload = await sendMessage(text);
      lastFailedMessage = "";
      loadingMessage.remove();
      appendMessage("bot", payload.reply);
      renderSuggestions(Array.isArray(payload.suggestions) && payload.suggestions.length
        ? payload.suggestions
        : CHAT_DEFAULT_SUGGESTIONS);
    } catch (error) {
      lastFailedMessage = text;
      loadingMessage.remove();
      appendMessage("bot", error.message || "No pudimos conectar con el chat.");
      setStatus("Puedes reintentar o usar los enlaces de contacto.", "error");
      renderSuggestions(["Reintentar", "Contacto", "Ver catalogo"]);
    } finally {
      setSending(false);
      input.focus();
    }
  };

  appendMessage("bot", "Hola, puedo ayudarte con modelos, materiales y pedidos especiales de Libretas Roca.");
  renderSuggestions();

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  closeButton.addEventListener("click", () => {
    setOpen(false);
    toggle.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitMessage(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
}

initHeader();
initGlobalLinks();
initRevealAnimations();
initCatalogFilters();
initCatalogModal();
initContactForm();
initChatWidget();
