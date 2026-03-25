import { useState, useCallback, useEffect } from 'react';
import type { Product, CartItem, User } from './types';
import type { ProductCategory, NavidadSubcategory } from './types';
import { SAMPLE_PRODUCTS, CATEGORIES, NAVIDAD_SUBCATEGORIES } from './constants';
import { supabase } from './lib/supabase';
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
