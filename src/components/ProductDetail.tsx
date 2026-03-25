import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ZoomIn, ZoomOut, MessageCircle, ShoppingCart, Sparkles,
  Heart, Star, HandHeart, Truck, Palette,
} from 'lucide-react';
import type { Product } from '../types';
import { formatPrice, getDiscountedPrice, COMPANY } from '../constants';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const AMBIENTS = [
  { id: 'none', label: 'Original', emoji: '🔍', bg: 'bg-gradient-to-br from-gray-50 to-white' },
  { id: 'living', label: 'En tu sala', emoji: '🛋️', bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50' },
  { id: 'tree', label: 'Con el árbol', emoji: '🎄', bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50' },
  { id: 'office', label: 'En la oficina', emoji: '🏢', bg: 'bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50' },
];

export default function ProductDetail({ product, isOpen, onClose, onAddToCart }: ProductDetailProps) {
  const [zoom, setZoom] = useState(1);
  const [activeAmbient, setActiveAmbient] = useState('none');
  const [liked, setLiked] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const hasDiscount = product.discountPercent > 0;
  const hasPrice = product.price > 0;
  const finalPrice = hasDiscount && hasPrice
    ? getDiscountedPrice(product.price, product.discountPercent)
    : product.price;

  const whatsappLink = `https://wa.me/${COMPANY.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(`Hola! Me interesa: ${product.name}`)}`;
  const currentAmbient = AMBIENTS.find(a => a.id === activeAmbient) || AMBIENTS[0];

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 1));

  const handleClose = () => {
    setZoom(1);
    setActiveAmbient('none');
    setLiked(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-3 sm:inset-6 lg:inset-10 xl:inset-16 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
          >
            {/* ===== LADO IZQUIERDO - IMAGEN ===== */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Top bar con badges */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  {hasDiscount && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg"
                    >
                      🔥 -{product.discountPercent}% OFF
                    </motion.div>
                  )}
                  {product.customizable && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Personalizable a tu gusto
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Like */}
                  <motion.button
                    whileTap={{ scale: 1.3 }}
                    onClick={() => setLiked(!liked)}
                    className={`p-2.5 rounded-full shadow-lg transition-colors cursor-pointer ${
                      liked ? 'bg-red-500 text-white' : 'bg-white/90 text-brand-gray hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  </motion.button>
                  {/* Cerrar */}
                  <button
                    onClick={handleClose}
                    className="p-2.5 rounded-full bg-white/90 hover:bg-white text-brand-dark shadow-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Imagen principal */}
              <div
                ref={imageRef}
                className={`flex-1 ${currentAmbient.bg} flex items-center justify-center overflow-hidden relative cursor-zoom-in p-8`}
                onClick={() => zoom === 1 && handleZoomIn()}
              >
                {/* Decoraciones de ambiente */}
                {activeAmbient === 'living' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-100/60 to-transparent" />
                    <div className="absolute bottom-6 left-10 text-5xl opacity-30">🛋️</div>
                    <div className="absolute bottom-6 right-10 text-4xl opacity-25">🪴</div>
                    <div className="absolute top-10 right-16 text-3xl opacity-20">🖼️</div>
                    <div className="absolute top-10 left-16 text-2xl opacity-20">💡</div>
                  </div>
                )}
                {activeAmbient === 'tree' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-100/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 text-6xl opacity-30">🎄</div>
                    <div className="absolute top-6 left-16 text-3xl opacity-25">⭐</div>
                    <div className="absolute bottom-6 right-8 text-3xl opacity-25">🎁</div>
                    <div className="absolute bottom-6 right-24 text-2xl opacity-20">🎁</div>
                    <div className="absolute top-12 right-10 text-2xl opacity-15">❄️</div>
                  </div>
                )}
                {activeAmbient === 'office' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-slate-100/60 to-transparent" />
                    <div className="absolute bottom-6 left-10 text-4xl opacity-25">🪑</div>
                    <div className="absolute top-10 right-16 text-3xl opacity-20">🪟</div>
                    <div className="absolute top-10 left-16 text-2xl opacity-20">📋</div>
                    <div className="absolute bottom-6 right-10 text-3xl opacity-20">🌿</div>
                  </div>
                )}

                <motion.img
                  src={product.images[0]}
                  alt={product.name}
                  className="max-w-[85%] max-h-[85%] object-contain select-none drop-shadow-xl"
                  animate={{ scale: zoom }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  drag={zoom > 1}
                  dragConstraints={imageRef}
                  dragElastic={0.1}
                  style={{ cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Barra de herramientas inferior */}
              <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
                {/* Zoom */}
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    className="p-1.5 rounded-full hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-brand-dark w-10 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="p-1.5 rounded-full hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Ambientes */}
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                  <span className="text-xs text-brand-gray font-medium mr-1 hidden sm:inline">Visualizar en:</span>
                  {AMBIENTS.map((amb) => (
                    <button
                      key={amb.id}
                      onClick={() => setActiveAmbient(amb.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                        activeAmbient === amb.id
                          ? 'bg-brand-pink text-white border-brand-pink shadow-md scale-105'
                          : 'bg-white text-brand-gray border-gray-200 hover:border-brand-pink-light hover:text-brand-pink'
                      }`}
                    >
                      <span>{amb.emoji}</span>
                      <span className="hidden sm:inline">{amb.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== LADO DERECHO - INFO ===== */}
            <div className="lg:w-[440px] xl:w-[480px] flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 bg-white">
              {/* Scroll area */}
              <div className="flex-1 overflow-y-auto">
                {/* Header con titulo */}
                <div className="px-7 pt-8 pb-5">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-heading text-2xl sm:text-[28px] font-bold text-brand-dark leading-snug"
                  >
                    {product.name}
                  </motion.h1>
                </div>

                {/* Separador */}
                <div className="mx-7 border-b border-gray-100" />

                {/* Descripcion */}
                <div className="px-7 py-5">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-brand-gray leading-[1.7] text-[15px]"
                  >
                    {product.description}
                  </motion.p>
                </div>

                {/* Separador */}
                <div className="mx-7 border-b border-gray-100" />

                {/* Personalizable destacado */}
                {product.customizable && (
                  <div className="px-7 py-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-brand-purple/5 via-brand-pink/5 to-brand-purple/10 border-2 border-brand-purple/15 rounded-2xl p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-br from-brand-purple to-brand-pink p-3 rounded-xl shadow-md flex-shrink-0">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading font-bold text-brand-purple text-[15px] mb-1.5">
                            Este producto es personalizable
                          </h3>
                          <p className="text-sm text-brand-gray leading-relaxed">
                            Elige colores, nombres, detalles y más.
                            Escribenos por WhatsApp y creamos algo unico para ti.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Separador si hubo personalizable */}
                {product.customizable && <div className="mx-7 border-b border-gray-100" />}

                {/* Precio */}
                <div className="px-7 py-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-3">Precio</p>
                    {hasPrice ? (
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="font-heading text-3xl font-bold text-brand-pink">
                          {formatPrice(finalPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-lg text-brand-gray line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-brand-amber/10 to-brand-amber/5 border border-brand-amber/25 rounded-xl px-5 py-4">
                        <span className="font-heading text-lg font-bold text-brand-dark block">
                          Precio a consultar
                        </span>
                        <p className="text-sm text-brand-gray mt-1">
                          Escribenos para cotizar este producto
                        </p>
                      </div>
                    )}
                    {hasDiscount && hasPrice && (
                      <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-xl mt-3">
                        <Star className="w-4 h-4" />
                        Ahorras {formatPrice(product.price - finalPrice)}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Separador */}
                <div className="mx-7 border-b border-gray-100" />

                {/* Caracteristicas */}
                <div className="px-7 py-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-4">Nuestras garantias</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: HandHeart, label: 'Hecho a mano', sub: 'Con amor y dedicacion', color: 'text-brand-pink bg-brand-pink/10' },
                        { icon: Star, label: 'Alta calidad', sub: 'Materiales premium', color: 'text-brand-amber bg-brand-amber/10' },
                        { icon: Truck, label: 'Envio Bogota', sub: 'Entrega a domicilio', color: 'text-brand-purple bg-brand-purple/10' },
                        { icon: MessageCircle, label: 'Atencion directa', sub: 'Respuesta rapida', color: 'text-green-600 bg-green-50' },
                      ].map((feat, i) => (
                        <div key={i} className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 flex items-start gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${feat.color}`}>
                            <feat.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-brand-dark leading-tight">{feat.label}</p>
                            <p className="text-xs text-brand-gray mt-0.5">{feat.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ===== Botones fijos abajo ===== */}
              <div className="border-t border-gray-200 px-7 py-5 space-y-3 bg-gray-50/50">
                {hasPrice ? (
                  <button
                    onClick={() => {
                      onAddToCart(product);
                      handleClose();
                    }}
                    className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] text-base shadow-md"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Agregar al carrito
                  </button>
                ) : (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] text-base shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Consultar por WhatsApp
                  </a>
                )}

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white border-2 border-green-400 text-green-700 font-semibold py-3.5 rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Preguntar por este producto
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
