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

-- 8. Tabla BugReport
CREATE TABLE IF NOT EXISTS "BugReport" (
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
ALTER TABLE "BugReport" DISABLE ROW LEVEL SECURITY;

-- 9. Columnas de política de datos en Client
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "acceptedDataPolicy" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "policyAcceptedAt" TIMESTAMP;

-- 10. Contador de visitas
CREATE TABLE IF NOT EXISTS "SiteStats" (
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
$$ LANGUAGE plpgsql;

-- 11. Verificar
SELECT 'Todas las tablas creadas exitosamente' AS resultado;
