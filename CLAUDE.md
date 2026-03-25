# CLAUDE.md — Borboletas

## Que es este proyecto

**Borboletas** es un marketplace web para un emprendimiento artesanal en Bogota, Colombia. Aplicacion React SPA para mostrar, filtrar y consultar productos artesanales hechos a mano: figuras navidenas, decoracion de Halloween, punteros y agendas, tejidos y detalles para desayunos sorpresa.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 (plugin Vite) + Motion (Framer Motion)
- **Icons:** Lucide React
- **Base de datos:** Supabase PostgreSQL (`ythsgjjawqzvhewenqex`) — conectado
- **Auth:** Login por email (tabla Client) + PIN para admin panel
- **Deploy:** Vercel (`borboletas-beta.vercel.app`) — desplegado y activo
- **Imagenes:** Hospedadas en postimg.cc
- **Screenshots:** html2canvas (para bug reports)

## Arquitectura

```
src/
  App.tsx                 -- Componente principal: routing, estado global, checkout, pasarela QR
  main.tsx                -- Entry point React
  index.css               -- Tailwind theme (colores brand, fuentes Poppins/Inter)
  types.ts                -- Product, CartItem, User, Order, ClientRow, OrderRow, BugReport, etc.
  constants.ts            -- COMPANY info, CATEGORIES, NAVIDAD_SUBCATEGORIES, 75 productos (fallback)
  lib/
    supabase.ts           -- Cliente Supabase (null si no hay env vars)
    migrations.ts         -- 7 migraciones SQL + seed de productos
  components/
    AdminPanel.tsx         -- Panel admin: 6 tabs (dashboard, productos, clientes, pedidos, bugs, SQL)
    AuthModal.tsx          -- Modal login/registro por email con politica de datos
    Navbar.tsx             -- Nav sticky con logo, busqueda, carrito, user avatar, menu mobile
    HeroCarousel.tsx       -- 6 slides automaticos (Navidad, Halloween, Punteros, Tejidos, Ofertas)
    DiscountBanner.tsx     -- Banner animado de beneficios
    CategorySlider.tsx     -- Slider horizontal por categoria con header gradiente tematico
    ProductCard.tsx        -- Card de producto (imagen, precio/consultar, descuento, badges)
    ProductDetail.tsx      -- Modal detalle fullscreen mobile / side-by-side desktop
    Cart.tsx               -- Sidebar carrito deslizable con totales y checkout
    BugReportWidget.tsx    -- Boton flotante rojo para reportar bugs (solo admin)
    Footer.tsx             -- Footer con logo, contacto, redes, info
    WhatsAppButton.tsx     -- Boton flotante fijo de WhatsApp
```

## Info de la Empresa

| Campo | Valor |
|-------|-------|
| Nombre | Borboletas |
| Tagline | Detalles hechos con amor |
| WhatsApp | +57 333 266 1702 |
| Instagram | @borboletas_bog |
| Instagram URL | https://www.instagram.com/borboletas_bog/ |
| Ciudad | Bogota, Colombia |
| Logo | https://i.postimg.cc/8cs0rvJm/logo-borboletas.png |
| Email contacto datos | sonillapilla123@gmail.com |

## Categorias y Productos

### 5 Categorias principales

| Categoria | Key | Emoji | Productos | Gradiente |
|-----------|-----|-------|-----------|-----------|
| Epoca de Navidad | navidad | 🎄 | 42 | rojo-verde |
| Epoca de Halloween | halloween | 🎃 | 5 | naranja-morado |
| Decoracion Desayunos Sorpresa | desayunos_sorpresa | 🎁 | 6 | rosa-amber |
| Punteros y Agendas | lapices_cuadernos | ✏️ | 16 | azul-teal |
| Tejidos Artesanales | tejidos | 🧶 | 6 | rosa-violeta |

**Total: 75 productos**

### Subcategorias de Navidad

| Subcategoria | Key | Emoji | Productos |
|--------------|-----|-------|-----------|
| Papa y Mama Noel | noel | 🎅 | 14 |
| Renos | renos | 🦌 | 18 |
| Osos Polares | osos_polares | 🐻‍❄️ | 3 |
| Munecos de Nieve | munecos_nieve | ⛄ | 2 |
| Pie de Arbol y Cojines | pie_arbol_cojines | 🎁 | 5 |

## Auth y Roles

| Rol | Acceso |
|-----|--------|
| **admin** | Panel CRUD productos/clientes/pedidos, bug reports, migraciones SQL |
| **user** | Ver catalogo, carrito, checkout, pasarela de pagos |

- **Auth usuarios:** Login/registro por email (tabla Client en Supabase)
- **Auth admin:** PIN configurado en `VITE_ADMIN_PIN` (.env.local) — default `borboletas2026`
- **Admin actual:** dramirez180929@gmail.com (role='admin' en Client)

## Estado Actual del Proyecto

- **Deploy:** Vercel activo en `borboletas-beta.vercel.app`
- **Backend:** Supabase PostgreSQL conectado con 7 migraciones
- **Tablas Supabase:** Product, Client, Order, OrderItem, BugReport, SiteStats
- **Admin Panel:** 6 tabs — Dashboard, Productos, Clientes, Pedidos, Bug Reports, SQL History
- **Checkout:** Completo — formulario → confirmacion → pasarela → QR → WhatsApp
- **Pasarela de pagos:** Nequi (QR pendiente), Bold (WhatsApp), Daviplata (proximamente)
- **Bug Report Widget:** Boton flotante rojo (solo admin) con inspector de elementos y screenshot
- **Contador de visitas:** Incremento atomico via Supabase RPC
- **Politica de datos:** Ley 1581 de 2012, email contacto: sonillapilla123@gmail.com
- **Precios:** Productos con precio=0 muestran "Consultar precio" con WhatsApp
- **Imagenes:** 75+ imagenes en postimg.cc cargando correctamente

## Comandos

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # TypeScript check + Vite build -> /dist
npm run preview      # Preview del build de produccion
npm run lint         # ESLint
```

## Variables de Entorno (Vercel + .env.local)

```
VITE_SUPABASE_URL=https://ythsgjjawqzvhewenqex.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_2BxnoYffopKVcyo3GDmjmQ_10lwTpHM
VITE_ADMIN_PIN=borboletas2026
```

## Convenciones

- Moneda: COP (pesos colombianos) — `Intl.NumberFormat('es-CO')`
- Imagenes de productos en postimg.cc (prefijo `https://i.postimg.cc/`)
- `referrerPolicy="no-referrer"` en todas las imagenes externas
- Productos sin precio muestran "Consultar precio" con boton de WhatsApp
- Productos con precio muestran boton "Agregar" al carrito
- Cada categoria tiene su gradiente tematico en el header del slider
- Layout: `max-w-[1400px]` con padding responsivo `px-4 sm:px-8 lg:px-12`
- Fuentes: Poppins (headings), Inter (body)
- Colores brand: pink (#E91E63), purple (#9C27B0), amber (#FFC107)
- Idioma de la app: Espanol colombiano
- `overscroll-behavior-x: contain` en tablas con scroll horizontal (evita gesto back en mobile)

## Modelo de Datos (Supabase)

```sql
-- Migración 001
CREATE TABLE "Product" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  subcategory TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  customizable BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migración 003
CREATE TABLE "Client" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT 'Bogota',
  role TEXT NOT NULL DEFAULT 'user',
  "acceptedDataPolicy" BOOLEAN DEFAULT FALSE,
  "policyAcceptedAt" TIMESTAMP,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migración 007
CREATE TABLE "Order" (
  id SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL REFERENCES "Client"(id) ON DELETE RESTRICT,
  address TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "OrderItem" (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES "Product"(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migración 004
CREATE TABLE "BugReport" (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  "reportedBy" TEXT NOT NULL,
  page TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ
);

-- Migración 006
CREATE TABLE "SiteStats" (
  id TEXT PRIMARY KEY DEFAULT 'main',
  "visitCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
-- + increment_visits() RPC function

-- RLS deshabilitado en todas las tablas, acceso via anon key
```

## Migraciones SQL (7 total)

| ID | Titulo | Estado |
|----|--------|--------|
| 001 | Crear tabla Product | Aplicada |
| 002 | Sembrar 75 productos | Aplicada (programática) |
| 003 | Crear tabla Client | Aplicada |
| 004 | Crear tabla BugReport | Aplicada |
| 005 | Columnas politica de datos en Client | Aplicada |
| 006 | Contador de visitas (SiteStats + RPC) | Aplicada |
| 007 | Crear tablas Order y OrderItem | Pendiente de ejecutar |

## Reglas Operacionales para Agentes IA

### CRITICO — Aislamiento de proyectos
- **NUNCA** usar herramientas MCP/nativas conectadas a otros proyectos sin confirmacion explicita
- **NUNCA** asumir que un MCP Supabase conectado pertenece a este proyecto
- Supabase de Borboletas: `ythsgjjawqzvhewenqex` — este es el unico proyecto autorizado
- Cada proyecto del usuario es completamente aislado a menos que el diga lo contrario
- Proyectos hermanos: Entre Peces (`blqvfrqkzaudrdbxjovt`), Colombian Coffee (sin Supabase)

### Lecciones aprendidas
1. **Lucide React no tiene icono Butterfly:** Se uso `Flower2` como alternativa, luego se reemplazo por el logo real en imagen
2. **Tailwind CSS 4 @import order:** El `@import url()` de Google Fonts debe ir ANTES de `@import "tailwindcss"`, de lo contrario genera error PostCSS
3. **postimg.cc referrerPolicy:** Todas las imagenes de postimg.cc requieren `referrerPolicy="no-referrer"` para cargar correctamente
4. **Vite dev server en Windows:** El launch.json debe usar `node` con `node_modules/vite/bin/vite.js` ya que `npm`/`npx` como runtimeExecutable falla con ENOENT en Windows
5. **Precios $0:** Los productos sin precio definido usan precio = 0 y muestran "Consultar precio" con boton de WhatsApp en lugar de carrito
6. **Spacing en Tailwind CSS 4:** Se agrego `--spacing: 0.25rem` en @theme para mantener la escala de espaciado correcta
7. **Category keys sin tildes:** Los keys de categorias/subcategorias NO deben tener acentos (ej: `lapices_cuadernos`, `munecos_nieve`) — solo los labels muestran tildes
8. **ProductDetail mobile:** Usar `inset-0` (fullscreen) en mobile, NO `inset-3` que recorta la imagen
9. **overscroll-behavior-x:** Usar `contain` en tablas con scroll horizontal para evitar que el gesto back del navegador interfiera en mobile
10. **html2canvas + oklch:** Tailwind CSS 4 usa oklch() que html2canvas no soporta — se reemplazan en el clone

### Flujo de trabajo recomendado
1. Leer este CLAUDE.md al inicio de cada sesion
2. Verificar `npx tsc --noEmit` antes y despues de cambios
3. Usar preview server para verificar cambios visuales
4. Los productos se cargan desde Supabase con fallback a `src/constants.ts`
5. Nuevos productos se crean desde el Admin Panel (icono usuario > Dashboard)
6. Imagenes nuevas subir a postimg.cc y usar la URL directa
7. Las migraciones SQL se ejecutan desde Admin Panel > SQL History (o copiando SQL a Supabase dashboard)
8. Vercel redeploy automatico al push a main
