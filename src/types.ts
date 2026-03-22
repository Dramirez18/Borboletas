export type ProductCategory =
  | 'navidad'
  | 'halloween'
  | 'desayunos_sorpresa'
  | 'lapices_cuadernos'
  | 'tejidos';

export type NavidadSubcategory =
  | 'noel'
  | 'renos'
  | 'osos_polares'
  | 'pie_arbol_cojines'
  | 'munecos_nieve';

export interface SubcategoryInfo {
  key: NavidadSubcategory;
  label: string;
  emoji: string;
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

export interface CategoryInfo {
  key: ProductCategory;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
  accentColor: string;
}
