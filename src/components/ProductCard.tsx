import { motion } from 'motion/react';
import { ShoppingCart, Sparkles, MessageCircle } from 'lucide-react';
import type { Product } from '../types';
import { formatPrice, getDiscountedPrice, COMPANY } from '../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetail }: ProductCardProps) {
  const hasDiscount = product.discountPercent > 0;
  const hasPrice = product.price > 0;
  const finalPrice = hasDiscount && hasPrice
    ? getDiscountedPrice(product.price, product.discountPercent)
    : product.price;

  const whatsappLink = `https://wa.me/${COMPANY.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(`Hola! Me interesa: ${product.name}`)}`;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group w-[260px] flex-shrink-0"
    >
      {/* Imagen */}
      <div
        className="relative h-60 bg-white overflow-hidden cursor-pointer p-2"
        onClick={() => onViewDetail(product)}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-xl"
          referrerPolicy="no-referrer"
        />

        {/* Badge descuento */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-discount text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            -{product.discountPercent}% OFF
          </div>
        )}

        {/* Badge personalizable */}
        {product.customizable && (
          <div className="absolute top-3 right-3 bg-brand-purple text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3" />
            Personalizable
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3
          className="font-heading font-semibold text-sm text-brand-dark mb-1 line-clamp-2 cursor-pointer hover:text-brand-pink transition-colors"
          onClick={() => onViewDetail(product)}
        >
          {product.name}
        </h3>

        <p className="text-xs text-brand-gray line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Precio */}
        <div className="flex items-center gap-2 mb-3">
          {hasPrice ? (
            <>
              <span className="font-heading font-bold text-lg text-brand-pink">
                {formatPrice(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-brand-gray line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </>
          ) : (
            <span className="font-heading font-semibold text-sm text-brand-purple">
              Consultar precio
            </span>
          )}
        </div>

        {/* Boton */}
        {hasPrice ? (
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white text-sm font-semibold py-2.5 rounded-full hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            Agregar
          </button>
        ) : (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold py-2.5 rounded-full hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            Consultar
          </a>
        )}
      </div>
    </motion.div>
  );
}
