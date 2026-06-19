import type { SupabaseClient } from '@supabase/supabase-js';
import { SAMPLE_PRODUCTS } from '../constants';

export interface Migration {
  id: string;
  title: string;
  description: string;
  sql: string;
  createdAt: string;
  appliedAt?: string;
}

const APPLIED_KEY = 'borboletas_migrations_applied';

export function getAppliedMigrations(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markMigrationApplied(id: string): void {
  const applied = getAppliedMigrations();
  applied[id] = new Date().toISOString();
  localStorage.setItem(APPLIED_KEY, JSON.stringify(applied));
}

export function unmarkMigrationApplied(id: string): void {
  const applied = getAppliedMigrations();
  delete applied[id];
  localStorage.setItem(APPLIED_KEY, JSON.stringify(applied));
}

export const MIGRATIONS: Migration[] = [
  {
    id: '001_create_product_table',
    title: 'Crear tabla Product',
    description: 'Tabla principal de productos con todas las columnas necesarias para el marketplace',
    sql: `-- Crear tabla Product
CREATE TABLE IF NOT EXISTS "Product" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('navidad','halloween','desayunos_sorpresa','lapices_cuadernos','tejidos')),
  subcategory TEXT CHECK (subcategory IN ('noel','renos','osos_polares','munecos_nieve','pie_arbol_cojines') OR subcategory IS NULL),
  images TEXT[] NOT NULL DEFAULT '{}',
  customizable BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"(category);
CREATE INDEX IF NOT EXISTS "Product_active_idx" ON "Product"(active);

-- Deshabilitar RLS para acceso directo
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;`,
    createdAt: '2026-03-24',
  },
  {
    id: '002_seed_products',
    title: 'Sembrar 75 productos iniciales',
    description: 'Inserta los 75 productos del catalogo inicial desde constants.ts usando el cliente Supabase',
    sql: '-- Esta migracion se ejecuta programaticamente usando seedProducts()\n-- Ver boton "Sembrar productos" en el panel de migraciones',
    createdAt: '2026-03-24',
  },
  {
    id: '003_create_client_table',
    title: 'Crear tabla Client',
    description: 'Tabla de clientes/usuarios para autenticacion por email y gestion de pedidos',
    sql: `-- Crear tabla Client
CREATE TABLE IF NOT EXISTS "Client" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT 'Bogota',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indice por email (lookup principal)
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"(email);

-- Deshabilitar RLS
ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;

-- Insertar admin por defecto
INSERT INTO "Client" (name, email, role)
VALUES ('Admin Borboletas', 'admin@borboletas.com', 'admin')
ON CONFLICT (email) DO NOTHING;`,
    createdAt: '2026-03-24',
  },
  {
    id: '004_create_bugreport_table',
    title: 'Crear tabla BugReport',
    description: 'Tabla para reportes de bugs del admin con prioridad y estado',
    sql: `CREATE TABLE IF NOT EXISTS "BugReport" (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  "reportedBy" TEXT NOT NULL,
  page TEXT,
  steps TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "BugReport_status_idx" ON "BugReport"(status);
ALTER TABLE "BugReport" DISABLE ROW LEVEL SECURITY;`,
    createdAt: '2026-03-24',
  },
  {
    id: '005_client_data_policy',
    title: 'Columnas de política de datos en Client',
    description: 'Agrega acceptedDataPolicy y policyAcceptedAt para cumplir Ley 1581 de 2012',
    sql: `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "acceptedDataPolicy" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "policyAcceptedAt" TIMESTAMP;`,
    createdAt: '2026-03-24',
  },
  {
    id: '006_visit_counter',
    title: 'Contador de visitas al sitio',
    description: 'Tabla SiteStats con función atómica increment_visits() para contar visitas',
    sql: `CREATE TABLE IF NOT EXISTS "SiteStats" (
  id TEXT PRIMARY KEY DEFAULT 'main',
  "visitCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE "SiteStats" DISABLE ROW LEVEL SECURITY;
INSERT INTO "SiteStats" (id, "visitCount") VALUES ('main', 0) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_visits()
RETURNS INTEGER AS $$
DECLARE new_count INTEGER;
BEGIN
  UPDATE "SiteStats" SET "visitCount" = "visitCount" + 1, "updatedAt" = NOW() WHERE id = 'main';
  SELECT "visitCount" INTO new_count FROM "SiteStats" WHERE id = 'main';
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;`,
    createdAt: '2026-03-24',
  },
  {
    id: '007_create_order_tables',
    title: 'Crear tablas Order y OrderItem',
    description: 'Tablas para gestionar pedidos de clientes con sus items',
    sql: `-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS "Order" (
  id SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL REFERENCES "Client"(id) ON DELETE RESTRICT,
  address TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_proceso','enviado','entregado')),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Order_clientId_idx" ON "Order"("clientId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"(status);
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;

-- Tabla de items de pedido
CREATE TABLE IF NOT EXISTS "OrderItem" (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES "Product"(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
ALTER TABLE "OrderItem" DISABLE ROW LEVEL SECURITY;`,
    createdAt: '2026-03-24',
  },
  {
    id: '008_enable_rls_policies',
    title: 'Habilitar RLS con políticas de seguridad',
    description: 'Activa Row Level Security en todas las tablas. La anon key deja de dar acceso total: catálogo público, datos de cada cliente solo para su dueño, escritura de productos solo admin. Requiere auth real (Email OTP). Re-ejecutable.',
    sql: `-- ============================================================
-- Migración 008: Habilitar Row Level Security (RLS) + políticas
-- ============================================================
-- Protege la base: la anon key (pública en el bundle JS) ya NO da
-- acceso total. Cada tabla define quién puede leer/escribir.
-- Usa el auth real (Email OTP) vía auth.email().
-- Re-ejecutable: DROP POLICY IF EXISTS antes de cada CREATE.

-- ---------- Funciones auxiliares (SECURITY DEFINER) ----------
-- SECURITY DEFINER = corren con permisos del dueño e IGNORAN RLS.
-- Esto evita recursión infinita al consultar Client desde una policy.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."Client"
    WHERE email = auth.email() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id FROM public."Client" WHERE email = auth.email() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_client_id() TO anon, authenticated;

-- ---------- PRODUCT: catálogo público, escritura solo admin ----------
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_public_read" ON "Product";
DROP POLICY IF EXISTS "product_admin_insert" ON "Product";
DROP POLICY IF EXISTS "product_admin_update" ON "Product";
DROP POLICY IF EXISTS "product_admin_delete" ON "Product";
CREATE POLICY "product_public_read" ON "Product"
  FOR SELECT TO public USING (true);
CREATE POLICY "product_admin_insert" ON "Product"
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "product_admin_update" ON "Product"
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_admin_delete" ON "Product"
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- CLIENT: cada quien su fila; admin ve todo ----------
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_select_own_or_admin" ON "Client";
DROP POLICY IF EXISTS "client_insert_own" ON "Client";
DROP POLICY IF EXISTS "client_update_own_or_admin" ON "Client";
DROP POLICY IF EXISTS "client_delete_admin" ON "Client";
CREATE POLICY "client_select_own_or_admin" ON "Client"
  FOR SELECT TO authenticated USING (email = auth.email() OR public.is_admin());
CREATE POLICY "client_insert_own" ON "Client"
  FOR INSERT TO authenticated WITH CHECK (email = auth.email());
CREATE POLICY "client_update_own_or_admin" ON "Client"
  FOR UPDATE TO authenticated
  USING (email = auth.email() OR public.is_admin())
  WITH CHECK (email = auth.email() OR public.is_admin());
CREATE POLICY "client_delete_admin" ON "Client"
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- ORDER: cada cliente sus pedidos; admin ve todo ----------
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_select_own_or_admin" ON "Order";
DROP POLICY IF EXISTS "order_insert_own" ON "Order";
DROP POLICY IF EXISTS "order_update_admin" ON "Order";
DROP POLICY IF EXISTS "order_delete_own_or_admin" ON "Order";
CREATE POLICY "order_select_own_or_admin" ON "Order"
  FOR SELECT TO authenticated USING ("clientId" = public.current_client_id() OR public.is_admin());
CREATE POLICY "order_insert_own" ON "Order"
  FOR INSERT TO authenticated WITH CHECK ("clientId" = public.current_client_id());
CREATE POLICY "order_update_admin" ON "Order"
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "order_delete_own_or_admin" ON "Order"
  FOR DELETE TO authenticated USING ("clientId" = public.current_client_id() OR public.is_admin());

-- ---------- ORDERITEM: ítems de pedidos propios; admin ve todo ----------
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orderitem_select_own_or_admin" ON "OrderItem";
DROP POLICY IF EXISTS "orderitem_insert_own" ON "OrderItem";
CREATE POLICY "orderitem_select_own_or_admin" ON "OrderItem"
  FOR SELECT TO authenticated USING (
    "orderId" IN (SELECT id FROM public."Order" WHERE "clientId" = public.current_client_id())
    OR public.is_admin()
  );
CREATE POLICY "orderitem_insert_own" ON "OrderItem"
  FOR INSERT TO authenticated WITH CHECK (
    "orderId" IN (SELECT id FROM public."Order" WHERE "clientId" = public.current_client_id())
  );

-- ---------- BUGREPORT: solo admin ----------
ALTER TABLE "BugReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bugreport_admin_all" ON "BugReport";
CREATE POLICY "bugreport_admin_all" ON "BugReport"
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- SITESTATS: lectura pública, escritura vía RPC ----------
ALTER TABLE "SiteStats" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sitestats_public_read" ON "SiteStats";
CREATE POLICY "sitestats_public_read" ON "SiteStats"
  FOR SELECT TO public USING (true);

-- Recrear increment_visits como SECURITY DEFINER para que pueda
-- actualizar el contador a pesar de RLS (no hay policy de UPDATE).
CREATE OR REPLACE FUNCTION increment_visits()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_count INTEGER;
BEGIN
  UPDATE "SiteStats" SET "visitCount" = "visitCount" + 1, "updatedAt" = NOW() WHERE id = 'main';
  SELECT "visitCount" INTO new_count FROM "SiteStats" WHERE id = 'main';
  RETURN new_count;
END;
$$;
GRANT EXECUTE ON FUNCTION increment_visits() TO anon, authenticated;`,
    createdAt: '2026-05-28',
  },
];

/**
 * Ejecuta una migracion SQL contra Supabase usando la funcion rpc
 */
export async function executeMigrationSQL(
  supabase: SupabaseClient,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      // Si rpc no existe, intentar con raw query via REST
      console.warn('[Migration] rpc exec_sql no disponible, intentando alternativa...', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Siembra productos en Supabase de forma NO destructiva.
 *
 * IMPORTANTE: usa `INSERT ... ON CONFLICT DO NOTHING` (ignoreDuplicates),
 * por lo que SOLO inserta productos cuyo `id` aún no existe en la base.
 * NUNCA sobreescribe filas existentes: los precios, nombres y descripciones
 * que la dueña haya editado desde el Admin Panel quedan intactos.
 *
 * Esto la hace segura e idempotente: sirve para "agregar productos nuevos
 * del catálogo (constants.ts) que falten en la base", sin pisar lo configurado.
 */
export async function seedProducts(
  supabase: SupabaseClient
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const products = SAMPLE_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      discountPercent: p.discountPercent,
      category: p.category,
      subcategory: p.subcategory || null,
      images: p.images,
      customizable: p.customizable,
      featured: p.featured,
      active: p.active,
      createdAt: p.createdAt,
      updatedAt: new Date().toISOString(),
    }));

    // ignoreDuplicates: true -> ON CONFLICT (id) DO NOTHING.
    // Solo inserta los que faltan; jamás actualiza los existentes.
    const { data, error } = await supabase
      .from('Product')
      .upsert(products, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error('[Seed] Error al sembrar productos:', error.message, error.details, error.hint);
      return { success: false, count: 0, error: error.message };
    }

    // `data` trae solo las filas realmente insertadas (las nuevas).
    return { success: true, count: data?.length ?? 0 };
  } catch (err) {
    return { success: false, count: 0, error: String(err) };
  }
}
