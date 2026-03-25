# CLAUDE.md — Borboletas

## Que es este proyecto

**Borboletas** es un marketplace web para un emprendimiento artesanal en Bogota, Colombia. Aplicacion React SPA para mostrar, filtrar y consultar productos artesanales hechos a mano: figuras navidenas, decoracion de Halloween, punteros para lapices, cuadernos decorados, tejidos y detalles para desayunos sorpresa.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 (plugin Vite) + Motion (Framer Motion)
- **Icons:** Lucide React
- **Base de datos:** Supabase PostgreSQL (`ythsgjjawqzvhewenqex`) — conectado
- **Auth:** PIN simple para admin (doble-click en logo activa modo admin)
- **Deploy:** Vercel (pendiente)
- **Imagenes:** Hospedadas en postimg.cc

## Arquitectura

```
src/
  App.tsx                 -- Componente principal con routing, estado global, vistas, CRUD handlers
  main.tsx                -- Entry point React
  index.css               -- Tailwind theme (colores brand, fuentes Poppins/Inter)
  types.ts                -- Product, CartItem, User, Order, CategoryInfo, etc.
  constants.ts            -- COMPANY info, CATEGORIES, NAVIDAD_SUBCATEGORIES, 75 productos (fallback)
  lib/
    supabase.ts           -- Cliente Supabase (null si no hay env vars)
    migrations.ts         -- Sistema de migraciones SQL + seed de productos
  components/
    AdminPanel.tsx         -- Panel CRUD admin con tabs (dashboard, productos, migraciones)
    Navbar.tsx             -- Nav sticky con logo, busqueda, carrito, toggle admin, menu mobile
    HeroCarousel.tsx       -- 6 slides automaticos (Navidad, Halloween, Lapices, Tejidos, Ofertas)
    DiscountBanner.tsx     -- Banner animado de beneficios (descuentos, personalizacion, envios)
    CategorySlider.tsx     -- Slider horizontal por categoria con header gradiente tematico
    ProductCard.tsx        -- Card de producto (imagen, precio/consultar, descuento, badges)
    ProductDetail.tsx      -- Modal detalle con zoom, ambientacion y WhatsApp
    Cart.tsx               -- Sidebar carrito deslizable con totales y descuentos
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

## Categorias y Productos

### 5 Categorias principales

| Categoria | Key | Emoji | Productos | Gradiente |
|-----------|-----|-------|-----------|-----------|
| Epoca de Navidad | navidad | 🎄 | 42 | rojo-verde |
| Epoca de Halloween | halloween | 🎃 | 5 | naranja-morado |
| Decoracion Desayunos Sorpresa | desayunos_sorpresa | 🎁 | 6 | rosa-amber |
| Lapices y Cuadernos | lapices_cuadernos | ✏️ | 16 | azul-teal |
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

Solo 2 roles. NO hay proveedores ni mayoristas.

| Rol | Acceso |
|-----|--------|
| **admin** | Panel CRUD productos, ver pedidos, gestionar descuentos |
| **user** | Ver catalogo, carrito, checkout, historial |

- **Auth:** PIN simple para admin (doble-click en logo -> ingresar PIN)
- **Admin PIN:** Configurado en VITE_ADMIN_PIN (.env.local)

## Estado Actual del Proyecto

- **Precios:** Todos los productos tienen precio = 0 (se muestra "Consultar precio")
- **Backend:** Supabase PostgreSQL conectado (`ythsgjjawqzvhewenqex`)
- **Admin Panel:** CRUD completo para productos (crear, editar, activar/desactivar, eliminar)
- **Deploy:** No desplegado aun
- **Checkout:** Estructura creada pero sin funcionalidad completa
- **Auth:** PIN simple para admin, sin auth de usuarios
- **Imagenes:** Todas las 75+ imagenes estan hospedadas en postimg.cc y cargando correctamente
- **Migraciones:** Sistema de migraciones SQL integrado en el Admin Panel

## Comandos

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # TypeScript check + Vite build -> /dist
npm run preview      # Preview del build de produccion
npm run lint         # ESLint
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
- Idioma de la app: Espanol

## Modelo de Datos (Supabase)

```sql
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
-- RLS deshabilitado, acceso via anon key
-- Futuro: Client, Order, OrderItem
```

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

### Flujo de trabajo recomendado
1. Leer este CLAUDE.md al inicio de cada sesion
2. Verificar `npx tsc --noEmit` antes y despues de cambios
3. Usar preview server para verificar cambios visuales
4. Los productos se cargan desde Supabase con fallback a `src/constants.ts`
5. Nuevos productos se crean desde el Admin Panel (doble-click en logo -> PIN)
6. Imagenes nuevas subir a postimg.cc y usar la URL directa
7. Las migraciones SQL se ejecutan desde Admin Panel > Base de Datos
