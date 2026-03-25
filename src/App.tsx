import { useState, useCallback, useEffect } from 'react';
import type { Product, CartItem, User } from './types';
import type { ProductCategory, NavidadSubcategory } from './types';
import { SAMPLE_PRODUCTS, CATEGORIES, NAVIDAD_SUBCATEGORIES, COMPANY, formatPrice, getDiscountedPrice } from './constants';
import { supabase } from './lib/supabase';
import { Users, ArrowLeft, CheckCircle2, Clock, MapPin, Phone as PhoneIcon, Calendar, CreditCard, MessageCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import DiscountBanner from './components/DiscountBanner';
import CategorySlider from './components/CategorySlider';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ProductDetail from './components/ProductDetail';
import AdminPanel from './components/AdminPanel';
import BugReportWidget from './components/BugReportWidget';
import AuthModal from './components/AuthModal';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('borboletas_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<NavidadSubcategory | null>(null);

  // Checkout state
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '', date: '', time: '' });
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'success' | 'payment' | 'qr'>('form');
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Supabase state
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  // Admin se determina por el rol del usuario logueado
  const isAdmin = user?.role === 'admin';

  // ========== BROWSER HISTORY (back button + mobile swipe gesture) ==========
  const navigateTo = useCallback((view: string) => {
    setCurrentView(view);
    window.history.pushState({ view }, '', view === 'home' ? window.location.pathname : `${window.location.pathname}#${view}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view && e.state.view !== '_guard') {
        setCurrentView(e.state.view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // User tries to go back beyond app entry — stay on home
        window.history.pushState({ view: 'home' }, '', window.location.pathname);
        setCurrentView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Guard: replace initial entry, then push home
    window.history.replaceState({ view: '_guard' }, '', window.location.pathname);
    window.history.pushState({ view: 'home' }, '', window.location.pathname);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Contador de visitas
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc('increment_visits').then(({ data, error }) => {
      if (!error && typeof data === 'number') {
        setVisitCount(data);
      } else {
        supabase!.from('SiteStats').select('visitCount').eq('id', 'main').single()
          .then(({ data: row }) => { if (row) setVisitCount((row as { visitCount: number }).visitCount); });
      }
    });
  }, []);

  // Persistir usuario en localStorage
  useEffect(() => {
    if (user) localStorage.setItem('borboletas_user', JSON.stringify(user));
    else localStorage.removeItem('borboletas_user');
  }, [user]);

  // Cargar productos desde Supabase con fallback a constants
  useEffect(() => {
    async function loadProducts() {
      if (!supabase) {
        console.warn('[App] Sin conexión Supabase, usando datos locales');
        setProducts(SAMPLE_PRODUCTS);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Product')
          .select('*')
          .order('name');

        if (error) {
          console.error('[Supabase] Error al cargar productos:', error.message, error.details, error.hint);
          setProducts(SAMPLE_PRODUCTS);
        } else if (data && data.length > 0) {
          setProducts(data as Product[]);
          console.log(`[Supabase] ${data.length} productos cargados`);
        } else {
          console.warn('[Supabase] Tabla vacia, usando datos locales');
          setProducts(SAMPLE_PRODUCTS);
        }
      } catch (err) {
        console.error('[Supabase] Error de conexión:', err);
        setProducts(SAMPLE_PRODUCTS);
      }

      setIsLoading(false);
    }

    loadProducts();
  }, []);

  // CRUD handlers para admin
  const handleUpdateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<boolean> => {
    if (supabase) {
      const { error } = await supabase
        .from('Product')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) {
        console.error('[Supabase] Error al actualizar:', error.message, error.details, error.hint);
        alert(`Error al actualizar: ${error.message}`);
        return false;
      }
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    return true;
  }, []);

  const handleToggleActive = useCallback(async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const newActive = !product.active;

    if (supabase) {
      const { error } = await supabase
        .from('Product')
        .update({ active: newActive, updatedAt: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Error al toggle active:', error.message);
        alert(`Error: ${error.message}`);
        return;
      }
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: newActive } : p)));
  }, [products]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (supabase) {
      const { error } = await supabase.from('Product').delete().eq('id', id);
      if (error) {
        console.error('[Supabase] Error al eliminar:', error.message);
        alert(`Error al eliminar: ${error.message}`);
      }
    }
  }, []);

  const handleCreateProduct = useCallback(async (product: Product): Promise<boolean> => {
    if (!supabase) {
      alert('No hay conexión con Supabase');
      return false;
    }

    const { error } = await supabase.from('Product').insert({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountPercent: product.discountPercent,
      category: product.category,
      subcategory: product.subcategory || null,
      images: product.images,
      customizable: product.customizable,
      featured: product.featured,
      active: product.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      console.error('[Supabase] Error al crear:', error.message, error.details, error.hint);
      alert(`Error al crear producto: ${error.message}`);
      return false;
    }

    setProducts((prev) => [...prev, { ...product, active: true }]);
    return true;
  }, []);

  // Cart actions
  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigateTo('catalog');
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  // Filtered products for catalog
  const getFilteredProducts = () => {
    let filtered = products.filter((p) => p.active);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
      return filtered;
    }

    if (activeCategory) {
      filtered = filtered.filter((p) => p.category === activeCategory);

      if (activeCategory === 'navidad' && activeSubcategory) {
        filtered = filtered.filter((p) => p.subcategory === activeSubcategory);
      }
    }

    return filtered;
  };

  const handleCategoryFilter = (cat: ProductCategory | null) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
    setSearchQuery('');
  };

  const getProductsByCategory = (categoryKey: string) => {
    return products.filter((p) => p.active && p.category === categoryKey);
  };

  const discountedProducts = products.filter(
    (p) => p.active && p.discountPercent > 0
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-gray font-body">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar
        cartItems={cartItems}
        onCartClick={() => setCartOpen(true)}
        onAuthClick={() => setAuthModalOpen(true)}
        onSearch={handleSearch}
        currentView={currentView}
        onNavigate={navigateTo}
        user={user}
        isAdmin={isAdmin}
      />

      {/* HOME */}
      {currentView === 'home' && (
        <>
          <HeroCarousel onNavigate={navigateTo} />
          <DiscountBanner />

          {/* Contador de visitas */}
          {visitCount > 0 && (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-6">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-brand-pink-light/30">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-pink to-brand-purple rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-brand-dark tabular-nums">{visitCount.toLocaleString('es-CO')}</p>
                    <p className="text-[10px] text-brand-gray uppercase tracking-wider font-semibold">visitas al sitio</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ofertas especiales */}
          {discountedProducts.length > 0 && (
            <section className="pt-10 pb-6">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
                <div className="flex items-center gap-5 mb-8">
                  <span className="text-5xl">🔥</span>
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-brand-dark">
                      Ofertas Especiales
                    </h2>
                    <p className="text-sm sm:text-base text-brand-gray mt-1">
                      Los mejores descuentos del momento
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2">
                  {discountedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onViewDetail={handleViewDetail}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Secciones por categoria */}
          {CATEGORIES.map((cat) => {
            const catProducts = getProductsByCategory(cat.key);
            if (catProducts.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
                  <div className="border-t border-brand-pink-light/20" />
                </div>
                <CategorySlider
                  category={cat}
                  products={catProducts}
                  onAddToCart={addToCart}
                  onViewDetail={handleViewDetail}
                />
              </div>
            );
          })}
        </>
      )}

      {/* CATALOGO */}
      {currentView === 'catalog' && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
              {searchQuery
                ? `Resultados: "${searchQuery}"`
                : activeCategory
                  ? CATEGORIES.find(c => c.key === activeCategory)?.label || 'Catálogo'
                  : 'Catálogo'}
            </h1>
            {(searchQuery || activeCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryFilter(null);
                }}
                className="text-sm text-brand-pink hover:text-brand-purple cursor-pointer font-medium"
              >
                Ver todos
              </button>
            )}
          </div>

          {/* Filtros por categoria */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 mb-6">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                !activeCategory && !searchQuery
                  ? 'bg-brand-pink text-white shadow-md'
                  : 'bg-white text-brand-dark hover:bg-brand-pink-light/30 border border-gray-200'
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryFilter(cat.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-brand-pink text-white shadow-md'
                    : 'bg-white text-brand-dark hover:bg-brand-pink-light/30 border border-gray-200'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Subcategorias de Navidad */}
          {activeCategory === 'navidad' && (
            <div className="bg-gradient-to-r from-red-50 to-green-50 border border-red-100 rounded-2xl p-4 mb-8">
              <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-3 px-1">
                Filtrar por tipo
              </p>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setActiveSubcategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                    !activeSubcategory
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white text-brand-dark hover:bg-red-50 border border-red-200'
                  }`}
                >
                  🎄 Todos
                </button>
                {NAVIDAD_SUBCATEGORIES.map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => setActiveSubcategory(sub.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                      activeSubcategory === sub.key
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-white text-brand-dark hover:bg-red-50 border border-red-200'
                    }`}
                  >
                    {sub.emoji} {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contador de resultados */}
          <p className="text-sm text-brand-gray mb-6">
            {getFilteredProducts().length} producto{getFilteredProducts().length !== 1 ? 's' : ''} encontrado{getFilteredProducts().length !== 1 ? 's' : ''}
          </p>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getFilteredProducts().map((product) => (
              <div key={product.id} className="flex justify-center">
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                  onViewDetail={handleViewDetail}
                />
              </div>
            ))}
          </div>

          {getFilteredProducts().length === 0 && (
            <div className="text-center py-16 text-brand-gray">
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm mt-1">Intenta con otra categoría o búsqueda</p>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT */}
      {currentView === 'checkout' && (
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
          {/* Back button */}
          <button onClick={() => { navigateTo('home'); setCheckoutStep('form'); }}
            className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand-pink mb-6 cursor-pointer">
            <ArrowLeft size={16} /> Volver al inicio
          </button>

          {/* STEP 1: Checkout Form */}
          {checkoutStep === 'form' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-brand-pink to-brand-purple px-6 py-5">
                <h2 className="text-white font-heading font-bold text-xl">Finalizar Pedido</h2>
                <p className="text-white/70 text-sm mt-1">{cartItems.length} producto{cartItems.length !== 1 ? 's' : ''} en tu carrito</p>
              </div>

              {/* Order summary */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-brand-dark text-sm mb-3">Resumen del pedido</h3>
                {cartItems.map(item => {
                  const price = item.product.discountPercent > 0 ? getDiscountedPrice(item.product.price, item.product.discountPercent) : item.product.price;
                  return (
                    <div key={item.product.id} className="flex justify-between text-sm py-1.5">
                      <span className="text-brand-gray">{item.product.name} x{item.quantity}</span>
                      <span className="font-medium text-brand-dark">{price > 0 ? formatPrice(price * item.quantity) : 'Consultar'}</span>
                    </div>
                  );
                })}
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-brand-dark">
                  <span>Total</span>
                  <span className="text-brand-pink">{formatPrice(cartItems.reduce((s, i) => {
                    const p = i.product.discountPercent > 0 ? getDiscountedPrice(i.product.price, i.product.discountPercent) : i.product.price;
                    return s + p * i.quantity;
                  }, 0))}</span>
                </div>
              </div>

              {/* Form */}
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (!supabase || !user) { alert('Debes iniciar sesión'); return; }
                if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.date || !checkoutForm.time) {
                  alert('Por favor completa todos los campos'); return;
                }
                setCheckoutSaving(true);
                try {
                  const total = cartItems.reduce((s, i) => {
                    const p = i.product.discountPercent > 0 ? getDiscountedPrice(i.product.price, i.product.discountPercent) : i.product.price;
                    return s + p * i.quantity;
                  }, 0);
                  // Find client
                  const { data: clientData } = await supabase.from('Client').select('id').eq('email', user.email).single();
                  if (!clientData) { alert('Error: cliente no encontrado'); setCheckoutSaving(false); return; }
                  // Create order
                  const { data: orderData, error: orderError } = await supabase.from('Order').insert({
                    clientId: clientData.id,
                    address: checkoutForm.address,
                    date: checkoutForm.date,
                    time: checkoutForm.time,
                    total,
                    status: 'pendiente',
                  }).select('id').single();
                  if (orderError || !orderData) { alert(`Error: ${orderError?.message || 'No se pudo crear el pedido'}`); setCheckoutSaving(false); return; }
                  // Create order items
                  const items = cartItems.map(i => ({
                    orderId: orderData.id,
                    productId: i.product.id,
                    name: i.product.name,
                    quantity: i.quantity,
                    price: i.product.discountPercent > 0 ? getDiscountedPrice(i.product.price, i.product.discountPercent) : i.product.price,
                  }));
                  await supabase.from('OrderItem').insert(items);
                  setLastOrderId(orderData.id);
                  setCheckoutStep('success');
                } catch (err) { alert('Error inesperado'); console.error(err); }
                setCheckoutSaving(false);
              }}>
                <div>
                  <label className="text-xs font-semibold text-brand-gray uppercase tracking-wider block mb-1">Nombre del destinatario *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/50" />
                    <input type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                      placeholder="Nombre completo" required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-gray uppercase tracking-wider block mb-1">Celular *</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/50" />
                    <input type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      placeholder="3XX XXX XXXX" required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-gray uppercase tracking-wider block mb-1">Dirección de entrega *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/50" />
                    <input type="text" value={checkoutForm.address} onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="Calle, carrera, barrio..." required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-brand-gray uppercase tracking-wider block mb-1">Fecha *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/50" />
                      <input type="date" value={checkoutForm.date} onChange={e => setCheckoutForm({ ...checkoutForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]} required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-brand-gray uppercase tracking-wider block mb-1">Hora *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/50" />
                      <select value={checkoutForm.time} onChange={e => setCheckoutForm({ ...checkoutForm, time: e.target.value })} required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none cursor-pointer appearance-none">
                        <option value="">Seleccionar</option>
                        {Array.from({ length: 11 }, (_, i) => i + 8).map(h => (
                          <option key={h} value={`${h}:00`}>{h}:00 {h < 12 ? 'AM' : 'PM'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {!user && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                    Debes <button type="button" onClick={() => setAuthModalOpen(true)} className="underline font-bold cursor-pointer">iniciar sesión</button> para completar tu pedido.
                  </div>
                )}

                <button type="submit" disabled={checkoutSaving || !user || cartItems.length === 0}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white py-4 rounded-xl font-bold text-base hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                  {checkoutSaving ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Success */}
          {checkoutStep === 'success' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-brand-dark mb-2">¡Pedido Confirmado!</h2>
              <p className="text-brand-gray mb-1">Pedido #{lastOrderId}</p>
              <p className="text-sm text-brand-gray mb-8">Tu pedido ha sido registrado exitosamente. Ahora procede al pago.</p>
              <button onClick={() => setCheckoutStep('payment')}
                className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white py-4 rounded-xl font-bold text-base hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" /> Ir a Pasarela de Pagos
              </button>
            </div>
          )}

          {/* STEP 3: Payment method selection */}
          {checkoutStep === 'payment' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-brand-pink to-brand-purple px-6 py-5">
                <h2 className="text-white font-heading font-bold text-xl">Selecciona método de pago</h2>
                <p className="text-white/70 text-sm mt-1">Pedido #{lastOrderId}</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { id: 'nequi', name: 'Nequi', color: 'bg-purple-500', available: true, desc: 'Pago con QR' },
                  { id: 'daviplata', name: 'Daviplata', color: 'bg-red-500', available: false, desc: 'Próximamente' },
                  { id: 'bold', name: 'Bold / Datáfono', color: 'bg-blue-600', available: true, desc: 'Solicitar link por WhatsApp' },
                ].map(method => (
                  <button key={method.id} disabled={!method.available}
                    onClick={() => {
                      if (method.id === 'bold') {
                        const total = cartItems.reduce((s, i) => {
                          const p = i.product.discountPercent > 0 ? getDiscountedPrice(i.product.price, i.product.discountPercent) : i.product.price;
                          return s + p * i.quantity;
                        }, 0);
                        const msg = `Hola Borboletas! 🦋 Quiero pagar mi pedido #${lastOrderId} por ${formatPrice(total)} con datáfono/Bold. ¿Me pueden enviar el link de pago?`;
                        window.open(`https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                        setCartItems([]);
                        return;
                      }
                      setSelectedPayment(method.id);
                      setCheckoutStep('qr');
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      method.available ? 'border-gray-200 hover:border-brand-pink hover:shadow-md' : 'border-gray-100 opacity-50 cursor-not-allowed'
                    }`}>
                    <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                      {method.name[0]}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-brand-dark">{method.name}</p>
                      <p className="text-xs text-brand-gray">{method.desc}</p>
                    </div>
                    {!method.available && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">PRÓXIMAMENTE</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: QR payment */}
          {checkoutStep === 'qr' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-center">
              <div className="bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-5">
                <h2 className="text-white font-heading font-bold text-xl">Pago con {selectedPayment === 'nequi' ? 'Nequi' : selectedPayment}</h2>
              </div>
              <div className="p-8">
                <p className="text-3xl font-bold text-brand-dark mb-6">{formatPrice(cartItems.reduce((s, i) => {
                  const p = i.product.discountPercent > 0 ? getDiscountedPrice(i.product.price, i.product.discountPercent) : i.product.price;
                  return s + p * i.quantity;
                }, 0))}</p>

                {/* QR placeholder — user will replace with real image */}
                <div className="w-64 h-64 mx-auto bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-6">
                  <p className="text-sm text-gray-400 px-4">QR de pago<br/>(pendiente por agregar)</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-bold text-purple-800 mb-2">Instrucciones:</p>
                  <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
                    <li>Abre la app de {selectedPayment === 'nequi' ? 'Nequi' : selectedPayment}</li>
                    <li>Escanea el código QR</li>
                    <li>Ingresa el monto exacto</li>
                    <li>Envía el comprobante por WhatsApp</li>
                  </ol>
                </div>

                <button onClick={() => {
                  const total = cartItems.reduce((s, i) => {
                    const p = i.product.discountPercent > 0 ? getDiscountedPrice(i.product.price, i.product.discountPercent) : i.product.price;
                    return s + p * i.quantity;
                  }, 0);
                  const itemList = cartItems.map(i => `• ${i.product.name} x${i.quantity}`).join('\n');
                  const msg = `Hola Borboletas! 🦋\n\nComprobante de pago:\n📋 Pedido #${lastOrderId}\n${itemList}\n💰 Total: ${formatPrice(total)}\n💳 Método: ${selectedPayment}\n\n📍 ${checkoutForm.address}\n📅 ${checkoutForm.date} ${checkoutForm.time}\n📞 ${checkoutForm.phone}`;
                  window.open(`https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  setCartItems([]);
                  setCheckoutStep('form');
                  setCheckoutForm({ name: '', phone: '', address: '', date: '', time: '' });
                  navigateTo('home');
                }}
                  className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-base hover:bg-emerald-600 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Enviar comprobante por WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN */}
      {currentView === 'admin' && isAdmin && (
        <AdminPanel
          products={products}
          onUpdateProduct={handleUpdateProduct}
          onToggleActive={handleToggleActive}
          onDeleteProduct={handleDeleteProduct}
          onCreateProduct={handleCreateProduct}
          onBack={() => navigateTo('home')}
        />
      )}

      <Footer />

      {/* Cart sidebar */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={() => {
          setCartOpen(false);
          navigateTo('checkout');
        }}
      />

      {/* Detalle de producto */}
      <ProductDetail
        product={selectedProduct}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAddToCart={addToCart}
      />

      {/* WhatsApp flotante */}
      <WhatsAppButton />

      {/* Bug Report Widget — solo para admin */}
      <BugReportWidget
        user={user}
        currentView={currentView}
        onBugReported={() => navigateTo('admin')}
      />

      {/* Auth modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={user}
        onLogin={(u) => setUser(u)}
        onLogout={() => setUser(null)}
      />
    </div>
  );
}
