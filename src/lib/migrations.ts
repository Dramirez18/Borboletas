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
