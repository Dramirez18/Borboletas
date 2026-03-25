import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product, ProductCategory, NavidadSubcategory } from '../types';
import { CATEGORIES, NAVIDAD_SUBCATEGORIES, formatPrice } from '../constants';
import { supabase } from '../lib/supabase';
import {
  MIGRATIONS,
  getAppliedMigrations,
  markMigrationApplied,
  unmarkMigrationApplied,
  executeMigrationSQL,
  seedProducts,
} from '../lib/migrations';
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Database,
  BarChart3, Package, Search, ChevronUp, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Copy, Check, AlertTriangle, DollarSign,
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  onToggleActive: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onCreateProduct: (product: Product) => Promise<boolean>;
  onBack: () => void;
}

type AdminTab = 'dashboard' | 'products' | 'sqlhistory';
type SortField = 'name' | 'price' | 'category' | 'discountPercent';
type SortDir = 'asc' | 'desc';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || 'borboletas2026';

export default function AdminPanel({
  products,
  onUpdateProduct,
  onToggleActive,
  onDeleteProduct,
  onCreateProduct,
  onBack,
}: AdminPanelProps) {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('borboletas_admin') === 'true'
  );
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tabs
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Products tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Modals
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', description: '', price: 0, discountPercent: 0,
    category: 'navidad' as ProductCategory, subcategory: undefined,
    images: [], customizable: false, featured: false, active: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // SQL History
  const [expandedMigration, setExpandedMigration] = useState<string | null>(null);
  const [appliedMap, setAppliedMap] = useState(() => getAppliedMigrations());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<Record<string, string>>({});

  // ========== STATS (must be before early return to maintain hook order) ==========
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.active).length;
    const inactive = total - active;
    const withDiscount = products.filter(p => p.discountPercent > 0).length;
    const featured = products.filter(p => p.featured).length;
    const customizable = products.filter(p => p.customizable).length;
    const byCategory = CATEGORIES.map(cat => ({
      ...cat,
      count: products.filter(p => p.category === cat.key).length,
      active: products.filter(p => p.category === cat.key && p.active).length,
    }));
    return { total, active, inactive, withDiscount, featured, customizable, byCategory };
  }, [products]);

  // ========== PRODUCT FILTERING & SORTING (must be before early return) ==========
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }
    if (filterActive === 'active') result = result.filter(p => p.active);
    else if (filterActive === 'inactive') result = result.filter(p => !p.active);
    else if (filterActive === 'discount') result = result.filter(p => p.discountPercent > 0);
    else if (filterActive === 'featured') result = result.filter(p => p.featured);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'price') cmp = a.price - b.price;
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'discountPercent') cmp = a.discountPercent - b.discountPercent;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, searchQuery, filterCategory, filterActive, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex ml-1 opacity-40">
      {sortField === field ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} />}
    </span>
  );

  // ========== EDIT MODAL ==========
  const openEditModal = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm({ ...product });
    setSaveMsg(null);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm({});
    setSaveMsg(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setSaving(true);
    setSaveMsg(null);
    const success = await onUpdateProduct(editingProduct, editForm);
    setSaving(false);
    if (success) {
      setSaveMsg({ type: 'ok', text: 'Producto actualizado correctamente' });
      setTimeout(() => { closeEditModal(); }, 800);
    } else {
      setSaveMsg({ type: 'err', text: 'Error al guardar cambios' });
    }
  };

  // ========== ADD MODAL ==========
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.images?.length) {
      alert('Por favor completa los campos obligatorios: nombre, descripción e imagen');
      return;
    }
    const id = newProduct.name!.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    setSaving(true);
    const success = await onCreateProduct({ ...newProduct, id } as Product);
    setSaving(false);
    if (success) {
      setShowAddModal(false);
      setNewProduct({
        name: '', description: '', price: 0, discountPercent: 0,
        category: 'navidad' as ProductCategory, subcategory: undefined,
        images: [], customizable: false, featured: false, active: true,
      });
    }
  };

  // ========== MIGRATION HANDLERS ==========
  const runMigration = async (migration: typeof MIGRATIONS[0]) => {
    if (!supabase) { alert('No hay conexión con Supabase'); return; }
    setMigrationStatus(prev => ({ ...prev, [migration.id]: 'running' }));

    if (migration.id === '002_seed_products') {
      const result = await seedProducts(supabase);
      if (result.success) {
        markMigrationApplied(migration.id);
        setAppliedMap(getAppliedMigrations());
        setMigrationStatus(prev => ({ ...prev, [migration.id]: `success: ${result.count} productos` }));
      } else {
        setMigrationStatus(prev => ({ ...prev, [migration.id]: `error: ${result.error}` }));
      }
      return;
    }

    const result = await executeMigrationSQL(supabase, migration.sql);
    if (result.success) {
      markMigrationApplied(migration.id);
      setAppliedMap(getAppliedMigrations());
      setMigrationStatus(prev => ({ ...prev, [migration.id]: 'success' }));
    } else {
      setMigrationStatus(prev => ({ ...prev, [migration.id]: `error: ${result.error}` }));
    }
  };

  const copySQL = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ========== AUTH (after all hooks) ==========
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('borboletas_admin', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-slate-200"
        >
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="font-bold text-xl text-slate-800 text-center mb-1">Panel de Administración</h2>
          <p className="text-sm text-slate-500 text-center mb-6">Ingresa el PIN de administrador</p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              placeholder="PIN"
              className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                pinError ? 'border-red-400 bg-red-50' : 'border-slate-200'
              }`}
              autoFocus
            />
            {pinError && <p className="text-red-500 text-sm text-center mt-2">PIN incorrecto</p>}
            <button
              type="submit"
              className="w-full mt-4 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Entrar
            </button>
          </form>
          <button onClick={onBack} className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  // ========== TABS CONFIG ==========
  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { key: 'products', label: 'Productos', icon: <Package size={16} />, badge: `${products.length}` },
    { key: 'sqlhistory', label: 'SQL History', icon: <Database size={16} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-bold text-2xl text-slate-800">Panel de Administración</h1>
            <p className="text-sm text-slate-400">Borboletas — Gestión de productos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${supabase ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-400 hidden sm:inline">{supabase ? 'Supabase conectado' : 'Sin conexión'}</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('borboletas_admin'); setIsAuthenticated(false); }}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setAdminTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              adminTab === tab.key
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                adminTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======== DASHBOARD TAB ======== */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Productos', value: stats.total, icon: <Package size={18} />, color: 'blue' },
              { label: 'Activos', value: stats.active, icon: <Eye size={18} />, color: 'emerald' },
              { label: 'Inactivos', value: stats.inactive, icon: <EyeOff size={18} />, color: 'slate' },
              { label: 'Con Descuento', value: stats.withDiscount, icon: <DollarSign size={18} />, color: 'amber' },
              { label: 'Destacados', value: stats.featured, icon: <AlertTriangle size={18} />, color: 'orange' },
              { label: 'Personalizables', value: stats.customizable, icon: <Pencil size={18} />, color: 'violet' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className={`w-10 h-10 bg-${kpi.color}-50 rounded-xl flex items-center justify-center text-${kpi.color}-600 mb-3`}>
                  {kpi.icon}
                </div>
                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Productos por Categoría</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byCategory.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => { setAdminTab('products'); setFilterCategory(cat.key); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all cursor-pointer text-left"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-700 truncate">{cat.label}</p>
                    <p className="text-xs text-slate-400">{cat.active}/{cat.count} activos</p>
                  </div>
                  <div className="w-16">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${cat.count > 0 ? (cat.active / cat.count) * 100 : 0}%` }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Supabase Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Conexión a Base de Datos</h3>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${supabase ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-medium text-slate-700">{supabase ? 'Supabase conectado' : 'Sin conexión a Supabase'}</p>
                <p className="text-xs text-slate-400">{supabase ? 'Proyecto: ythsgjjawqzvhewenqex' : 'Usando datos locales como fallback'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== PRODUCTS TAB ======== */}
      {adminTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
              />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-amber-400/50">
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>)}
            </select>
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-amber-400/50">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="discount">Con descuento</option>
              <option value="featured">Destacados</option>
            </select>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap shadow-sm">
              <Plus size={16} /> Agregar producto
            </button>
          </div>

          <p className="text-sm text-slate-400">{filteredProducts.length} resultados</p>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Imagen</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      Nombre <SortIcon field="name" />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('category')}>
                      Categoría <SortIcon field="category" />
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('price')}>
                      Precio <SortIcon field="price" />
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('discountPercent')}>
                      Dto% <SortIcon field="discountPercent" />
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors ${!product.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <img
                          src={product.images[0] || ''}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100"
                          referrerPolicy="no-referrer"
                          onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="%23f1f5f9" width="48" height="48" rx="12"/><text x="24" y="30" text-anchor="middle" fill="%2394a3b8" font-size="18">?</text></svg>'; }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 truncate max-w-[200px]">{product.name}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{product.description.substring(0, 60)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                          {CATEGORIES.find(c => c.key === product.category)?.emoji} {CATEGORIES.find(c => c.key === product.category)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.price === 0
                          ? <span className="text-xs text-slate-400 italic">Consultar</span>
                          : <span className="font-bold text-slate-800">{formatPrice(product.price)}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.discountPercent > 0
                          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{product.discountPercent}%</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onToggleActive(product.id)}
                          className={`text-xs px-3 py-1 rounded-full font-semibold cursor-pointer transition-colors ${
                            product.active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {product.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(product)}
                            className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors cursor-pointer" title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => {
                            if (confirm(`Eliminar "${product.name}"? Esta accion no se puede deshacer.`)) onDeleteProduct(product.id);
                          }} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======== SQL HISTORY TAB ======== */}
      {adminTab === 'sqlhistory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-1">
              <Database size={20} className="text-violet-600" />
              <h3 className="font-bold text-lg text-slate-800">SQL Migration History</h3>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm text-slate-400">
                {MIGRATIONS.length} migraciones &middot; {Object.keys(appliedMap).length} aplicadas
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} /> Aplicado</span>
                <span className="flex items-center gap-1 text-amber-600"><Clock size={12} /> Pendiente</span>
              </div>
            </div>

            <div className="space-y-3">
              {MIGRATIONS.map((migration, idx) => {
                const isApplied = !!appliedMap[migration.id];
                const isExpanded = expandedMigration === migration.id;
                const status = migrationStatus[migration.id];

                return (
                  <div key={migration.id} className={`border rounded-xl overflow-hidden transition-colors ${isApplied ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                    {/* Header */}
                    <button
                      onClick={() => setExpandedMigration(isExpanded ? null : migration.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      {isApplied ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <Clock size={18} className="text-amber-500 shrink-0" />}
                      <span className="text-xs font-mono text-slate-400 shrink-0">#{String(idx + 1).padStart(3, '0')}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-700 truncate">{migration.title}</p>
                        <p className="text-xs text-slate-400 truncate italic">{migration.description}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">{migration.createdAt}</span>
                      <ChevronRight size={16} className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3">
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button onClick={() => copySQL(migration.id, migration.sql)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                  copiedId === migration.id ? 'bg-emerald-500 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                }`}>
                                {copiedId === migration.id ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar SQL</>}
                              </button>
                              {!isApplied && (
                                <button onClick={() => runMigration(migration)} disabled={!supabase || status === 'running'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors">
                                  {status === 'running' ? 'Ejecutando...' : 'Ejecutar'}
                                </button>
                              )}
                              <button onClick={() => {
                                if (isApplied) unmarkMigrationApplied(migration.id);
                                else markMigrationApplied(migration.id);
                                setAppliedMap(getAppliedMigrations());
                              }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                isApplied ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600' : 'bg-amber-100 text-amber-700 hover:bg-emerald-100 hover:text-emerald-700'
                              }`}>
                                {isApplied ? <><CheckCircle2 size={12} /> Aplicado</> : <><Clock size={12} /> Marcar aplicado</>}
                              </button>
                            </div>

                            {status && status !== 'running' && (
                              <p className={`text-xs px-3 py-1.5 rounded-lg ${status.startsWith('error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                {status}
                              </p>
                            )}

                            {/* SQL Code */}
                            <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-x-auto max-h-96 overflow-y-auto font-mono leading-relaxed">
                              {migration.sql}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Las migraciones se registran en <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">src/lib/migrations.ts</code>
              </p>
              <p className="text-xs text-slate-400 mt-1">Cada cambio de schema o datos se agrega como una nueva entrada en el array MIGRATIONS.</p>
            </div>
          </div>
        </div>
      )}

      {/* ======== EDIT PRODUCT MODAL ======== */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={closeEditModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Pencil size={18} className="text-amber-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Editar producto</h3>
                </div>
                <button onClick={closeEditModal} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={18} /></button>
              </div>
              <div className="p-6">
                <ProductFormFields form={editForm} onChange={setEditForm} />
                {saveMsg && (
                  <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${saveMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {saveMsg.text}
                  </div>
                )}
                <div className="flex gap-3 justify-end mt-6">
                  <button onClick={closeEditModal} className="px-5 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl cursor-pointer">Cancelar</button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 cursor-pointer shadow-sm">
                    <Save size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======== ADD PRODUCT MODAL ======== */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Plus size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Agregar producto</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={18} /></button>
              </div>
              <div className="p-6">
                <ProductFormFields form={newProduct} onChange={setNewProduct} isNew />
                <div className="flex gap-3 justify-end mt-6">
                  <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl cursor-pointer">Cancelar</button>
                  <button onClick={handleCreateProduct} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 cursor-pointer shadow-sm">
                    <Plus size={15} /> {saving ? 'Creando...' : 'Crear producto'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== Shared Form Component =====
function ProductFormFields({
  form,
  onChange,
  isNew,
}: {
  form: Partial<Product>;
  onChange: (form: Partial<Product>) => void;
  isNew?: boolean;
}) {
  const imageUrl = form.images?.[0] || '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nombre *</label>
        <input type="text" value={form.name || ''} onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="Nombre del producto"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Descripción *</label>
        <textarea value={form.description || ''} onChange={e => onChange({ ...form, description: e.target.value })}
          rows={3} placeholder="Descripción del producto..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 resize-none" />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Categoría *</label>
        <select value={form.category || 'navidad'} onChange={e => onChange({ ...form, category: e.target.value as ProductCategory, subcategory: undefined })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-amber-400/50">
          {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>)}
        </select>
      </div>
      {form.category === 'navidad' && (
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Subcategoria</label>
          <select value={form.subcategory || ''} onChange={e => onChange({ ...form, subcategory: (e.target.value || undefined) as NavidadSubcategory | undefined })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer focus:ring-2 focus:ring-amber-400/50">
            <option value="">Sin subcategoria</option>
            {NAVIDAD_SUBCATEGORIES.map(sub => <option key={sub.key} value={sub.key}>{sub.emoji} {sub.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Precio (COP)</label>
        <input type="number" min="0" value={form.price || 0} onChange={e => onChange({ ...form, price: Number(e.target.value) })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
        <p className="text-[10px] text-slate-400 mt-1">0 = Mostrar "Consultar precio"</p>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Descuento %</label>
        <input type="number" min="0" max="100" value={form.discountPercent || 0} onChange={e => onChange({ ...form, discountPercent: Number(e.target.value) })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">URL de imagen *</label>
        <input type="url" value={imageUrl} onChange={e => onChange({ ...form, images: [e.target.value] })}
          placeholder="https://i.postimg.cc/..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="w-20 h-20 rounded-xl object-cover mt-2 border border-slate-200" referrerPolicy="no-referrer"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>
      <div className="sm:col-span-2 flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.customizable || false} onChange={e => onChange({ ...form, customizable: e.target.checked })}
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
          <span className="text-sm text-slate-600">Personalizable</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.featured || false} onChange={e => onChange({ ...form, featured: e.target.checked })}
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
          <span className="text-sm text-slate-600">Destacado</span>
        </label>
        {!isNew && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active !== false} onChange={e => onChange({ ...form, active: e.target.checked })}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
            <span className="text-sm text-slate-600">Activo</span>
          </label>
        )}
      </div>
    </div>
  );
}
