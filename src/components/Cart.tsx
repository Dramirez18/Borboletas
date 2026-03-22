import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../types';
import { formatPrice, getDiscountedPrice } from '../constants';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartProps) {
  const total = items.reduce((sum, item) => {
    const price = item.product.discountPercent > 0
      ? getDiscountedPrice(item.product.price, item.product.discountPercent)
      : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const totalSaved = items.reduce((sum, item) => {
    if (item.product.discountPercent <= 0) return sum;
    const saved = item.product.price - getDiscountedPrice(item.product.price, item.product.discountPercent);
    return sum + saved * item.quantity;
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-pink-light/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-pink" />
                <h2 className="font-heading font-bold text-lg">
                  Tu Carrito ({items.length})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-brand-pink-light/30 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-brand-gray">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Tu carrito está vacío</p>
                  <p className="text-sm mt-1">Agrega productos para comenzar</p>
                </div>
              ) : (
                items.map((item) => {
                  const hasDiscount = item.product.discountPercent > 0;
                  const unitPrice = hasDiscount
                    ? getDiscountedPrice(item.product.price, item.product.discountPercent)
                    : item.product.price;

                  return (
                    <div key={item.product.id} className="flex gap-3 bg-brand-cream rounded-xl p-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-brand-dark line-clamp-1">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-brand-pink">
                            {formatPrice(unitPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-brand-gray line-through">
                              {formatPrice(item.product.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white rounded-full px-1">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 hover:text-brand-pink transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 hover:text-brand-pink transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1.5 text-brand-gray hover:text-discount transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-brand-pink-light/30 p-4 space-y-3">
                {totalSaved > 0 && (
                  <div className="bg-green-50 text-green-700 text-sm font-medium px-3 py-2 rounded-lg text-center">
                    Estás ahorrando {formatPrice(totalSaved)} con tus descuentos 🎉
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-lg">Total</span>
                  <span className="font-heading font-bold text-xl text-brand-pink">
                    {formatPrice(total)}
                  </span>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold py-3 rounded-full hover:shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  Finalizar Pedido
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
