# Libretas Roca - sitio web estático

Este paquete contiene una página web promocional para **libretasroca.com**, diseñada para un negocio de libretas ecológicas hechas a mano con materiales reciclados.

## Estructura incluida

```text
libretasroca_web/
├── Index.html
├── index.html
├── Styles.css
├── Scripts.js
├── robots.txt
├── sitemap.xml
├── Fotos/
│   ├── favicon.svg
│   └── Modelos/
│       ├── libreta-roca-clasica.svg
│       ├── libreta-botanica.svg
│       ├── libreta-minimal.svg
│       ├── libreta-artista.svg
│       ├── libreta-agenda.svg
│       ├── libreta-retazos.svg
│       └── INSTRUCCIONES_FOTOS.md
└── Paginas/
    └── Catalogo.html
```

Incluí también `index.html` en minúsculas porque muchos hostings Linux buscan ese archivo automáticamente al entrar a la raíz del dominio. `Index.html` se conserva porque fue la estructura solicitada.

## Qué debes editar primero

### 1. Instagram

Abre `Scripts.js` y cambia esta línea:

```js
const INSTAGRAM_URL = "https://www.instagram.com/libretasroca/";
```

por el perfil real.

### 2. Correo de contacto

En `Scripts.js`, cambia:

```js
const CONTACT_EMAIL = "contacto@libretasroca.com";
```

por el correo real.

### 3. Fotos de modelos

Guarda tus fotos dentro de:

```text
Fotos/Modelos/
```

Para agregar nuevos modelos, usa el panel administrativo desde `Paginas/Login.html` y sube las portadas desde la interfaz.

Si deseas cambiar solo la imagen de una libreta existente, usa el administrador y actualiza el registro en la base de datos.
  descripcion: "Libreta artesanal con portada floral y hojas recicladas."
}
```

## Cómo subirlo al dominio

Sube todos los archivos y carpetas al directorio público del hosting, normalmente llamado `public_html`, `www`, `htdocs` o similar.

El dominio `libretasroca.com` debe apuntar a la carpeta donde esté `index.html`.

## Notas técnicas

- Es un sitio estático: no necesita base de datos.
- El formulario abre la aplicación de correo del visitante usando `mailto:`.
- Para recibir formularios directamente desde la web se puede conectar Formspree, Netlify Forms, EmailJS o un backend propio.

Variables de entorno para administración:
- `ADMIN_EMAIL`: correo administrador.
- `ADMIN_PASSWORD`: contraseña administrador.
- `ADMIN_AUTH_SECRET`: secreto para firmar tokens.

Crea un archivo `.env` a partir de `.env.example` y configura esos valores en tu entorno de desarrollo o en Netlify.
- El catálogo se edita desde `Scripts.js`; no requiere CMS.
