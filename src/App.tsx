import { useState, useCallback } from 'react';
import type { Product, CartItem, User } from './types';
import type { ProductCategory, NavidadSubcategory } from './types';
import { SAMPLE_PRODUCTS, CATEGORIES, NAVIDAD_SUBCATEGORIES } from './constants';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import DiscountBanner from './components/DiscountBanner';
import CategorySlider from './components/CategorySlider';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ProductDetail from './components/ProductDetail';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<NavidadSubcategory | null>(null);

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
    setCurrentView('catalog');
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  // Filtered products for catalog
  const getFilteredProducts = () => {
    let products = SAMPLE_PRODUCTS.filter((p) => p.active);

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
      return products;
    }

    // Category filter
    if (activeCategory) {
      products = products.filter((p) => p.category === activeCategory);

      // Subcategory filter (Navidad)
      if (activeCategory === 'navidad' && activeSubcategory) {
        products = products.filter((p) => p.subcategory === activeSubcategory);
      }
    }

    return products;
  };

  const handleCategoryFilter = (cat: ProductCategory | null) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
    setSearchQuery('');
  };

  // Products by category
  const getProductsByCategory = (categoryKey: string) => {
    return SAMPLE_PRODUCTS.filter((p) => p.active && p.category === categoryKey);
  };

  // Featured products (with discount)
  const discountedProducts = SAMPLE_PRODUCTS.filter(
    (p) => p.active && p.discountPercent > 0
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar
        cartItems={cartItems}
        onCartClick={() => setCartOpen(true)}
        onAuthClick={() => {}}
        onSearch={handleSearch}
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
      />

      {/* HOME */}
      {currentView === 'home' && (
        <>
          <HeroCarousel onNavigate={setCurrentView} />
          <DiscountBanner />

          {/* Ofertas especiales */}
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

          {/* Secciones por categoría */}
          {CATEGORIES.map((cat) => {
            const products = getProductsByCategory(cat.key);
            if (products.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
                  <div className="border-t border-brand-pink-light/20" />
                </div>
                <CategorySlider
                  category={cat}
                  products={products}
                  onAddToCart={addToCart}
                  onViewDetail={handleViewDetail}
                />
              </div>
            );
          })}
        </>
      )}

      {/* CATÁLOGO */}
      {currentView === 'catalog' && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
              {searchQuery
                ? `Resultados: "${searchQuery}"`
                : activeCategory
                  ? CATEGORIES.find(c => c.key === activeCategory)?.label || 'Catalogo'
                  : 'Catalogo'}
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
              <p className="text-sm mt-1">Intenta con otra categoria o busqueda</p>
            </div>
          )}
        </div>
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
          setCurrentView('checkout');
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
    </div>
  );
}
