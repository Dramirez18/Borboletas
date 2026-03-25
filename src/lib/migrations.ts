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
 * Siembra los 75 productos iniciales en Supabase
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

    const { error } = await supabase
      .from('Product')
      .upsert(products, { onConflict: 'id' });

    if (error) {
      console.error('[Seed] Error al sembrar productos:', error.message, error.details, error.hint);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: products.length };
  } catch (err) {
    return { success: false, count: 0, error: String(err) };
  }
}
