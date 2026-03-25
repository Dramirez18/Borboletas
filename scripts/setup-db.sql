-- =============================================
-- BORBOLETAS - Setup inicial de Base de Datos
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Crear tabla Product
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

-- 2. Indices
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"(category);
CREATE INDEX IF NOT EXISTS "Product_active_idx" ON "Product"(active);

-- 3. Deshabilitar RLS para acceso con anon key
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;

-- 4. Crear tabla Client
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

-- 5. Indice por email
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"(email);

-- 6. Deshabilitar RLS para Client
ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;

-- 7. Admin por defecto
INSERT INTO "Client" (name, email, role)
VALUES ('Admin Borboletas', 'admin@borboletas.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 8. Verificar
SELECT 'Tablas Product y Client creadas exitosamente' AS resultado;
