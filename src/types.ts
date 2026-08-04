// Categorías y subcategorías son DINÁMICAS (se gestionan desde el Admin Panel),
// por eso son strings libres. Los valores base viven en constants.ts (fallback)
// y en la tabla Category de Supabase.
export type ProductCategory = string;
export type NavidadSubcategory = string;
export type Subcategory = string;

export interface SubcategoryInfo {
  key: NavidadSubcategory;
  label: string;
  emoji: string;
  parentKey: string;        // categoría principal a la que pertenece
  sortOrder?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  category: ProductCategory;
  subcategory?: NavidadSubcategory;
  images: string[];
  customizable: boolean;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizationNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  role: 'user' | 'admin';
}

export type OrderStatus = 'pendiente' | 'en_proceso' | 'enviado' | 'entregado';

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  total: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  customizationNotes?: string;
}

export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';

export interface BugReport {
  id: number;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  reportedBy: string;
  page?: string;
  steps?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ─── Admin Row types (para tablas Supabase) ───

export interface ClientRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  role: string;
  acceptedDataPolicy?: boolean;
  policyAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRow {
  id: number;
  clientId: number;
  address: string;
  date: string;
  time: string;
  total: number;
  status: string;
  createdAt: string;
  // Enriched fields
  clientName?: string;
  itemCount?: number;
}

export interface OrderItemRow {
  id: number;
  orderId: number;
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
}

export interface CategoryInfo {
  key: ProductCategory;
  label: string;
  emoji: string;
  description: string;
  color1: string;              // inicio del gradiente (hex, ej. '#b91c1c')
  color2: string;              // fin del gradiente (hex)
  parentKey?: string | null;   // null/undefined = categoría principal
  sortOrder?: number;
  active?: boolean;
}
