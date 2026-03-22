import { useState } from 'react';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import type { CartItem } from '../types';
import { COMPANY } from '../constants';

interface NavbarProps {
  cartItems: CartItem[];
  onCartClick: () => void;
  onAuthClick: () => void;
  onSearch: (query: string) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  user: { name: string; role: string } | null;
}

export default function Navbar({
  cartItems,
  onCartClick,
  onAuthClick,
  onSearch,
  currentView,
  onNavigate,
  user,
}: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      {/* Banner descuento superior */}
      <div className="bg-gradient-to-r from-brand-pink via-brand-purple to-brand-pink animate-gradient text-white text-center py-1.5 text-sm font-medium">
        Descuentos hasta del <span className="font-bold text-brand-amber">50% OFF</span> en productos seleccionados
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <img
              src={COMPANY.logo}
              alt={COMPANY.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-contain group-hover:scale-110 transition-transform"
              referrerPolicy="no-referrer"
            />
            <span className="font-heading text-2xl sm:text-3xl font-bold text-brand-dark">
              Borboletas
            </span>
          </button>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { key: 'home', label: 'Inicio' },
              { key: 'catalog', label: 'Catalogo' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  currentView === item.key
                    ? 'text-brand-pink'
                    : 'text-brand-dark hover:text-brand-purple'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full hover:bg-brand-pink-light/30 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5 text-brand-dark" />
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="p-2 rounded-full hover:bg-brand-pink-light/30 transition-colors relative cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5 text-brand-dark" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User */}
            <button
              onClick={user ? () => onNavigate('profile') : onAuthClick}
              className="p-2 rounded-full hover:bg-brand-pink-light/30 transition-colors cursor-pointer"
            >
              <User className="w-5 h-5 text-brand-dark" />
            </button>

            {/* Admin */}
            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-brand-purple text-white'
                    : 'bg-brand-purple-light/30 text-brand-purple hover:bg-brand-purple hover:text-white'
                }`}
              >
                Admin
              </button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-brand-pink-light/30 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar expandible */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full px-4 py-2.5 rounded-full border-2 border-brand-pink-light focus:border-brand-pink outline-none text-sm"
                autoFocus
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                <Search className="w-4 h-4 text-brand-gray" />
              </button>
            </div>
          </form>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-brand-pink-light/30">
            <div className="flex flex-col gap-2 pt-3">
              {[
                { key: 'home', label: 'Inicio' },
                { key: 'catalog', label: 'Catalogo' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    onNavigate(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentView === item.key
                      ? 'bg-brand-pink-light/30 text-brand-pink'
                      : 'text-brand-dark hover:bg-brand-pink-light/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
