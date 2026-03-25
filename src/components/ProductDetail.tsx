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
  { id: 'living', label: 'Sala', emoji: '🛋️', bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50' },
  { id: 'tree', label: 'Árbol', emoji: '🎄', bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50' },
  { id: 'office', label: 'Oficina', emoji: '🏢', bg: 'bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50' },
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

          {/* Modal — en mobile es fullscreen scrollable, en desktop es side-by-side */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 sm:inset-4 lg:inset-8 xl:inset-14 z-50 bg-white sm:rounded-3xl shadow-2xl overflow-y-auto lg:overflow-hidden lg:flex lg:flex-row"
          >
            {/* Close + Like buttons — fixed en mobile */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm lg:absolute lg:top-0 lg:right-0 lg:left-auto lg:bg-transparent lg:backdrop-blur-none">
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                    🔥 -{product.discountPercent}% OFF
                  </span>
                )}
                {product.customizable && (
                  <span className="bg-gradient-to-r from-brand-purple to-brand-pink text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Personalizable
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 1.3 }}
                  onClick={() => setLiked(!liked)}
                  className={`p-2 rounded-full shadow transition-colors cursor-pointer ${
                    liked ? 'bg-red-500 text-white' : 'bg-white text-brand-gray hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                </motion.button>
                <button onClick={handleClose}
                  className="p-2 rounded-full bg-white text-brand-dark shadow hover:bg-gray-50 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ===== IMAGEN — en mobile es bloque, en desktop es mitad izquierda ===== */}
            <div className="lg:flex-1 lg:flex lg:flex-col lg:min-h-0 relative">
              {/* Imagen principal */}
              <div
                ref={imageRef}
                className={`aspect-square sm:aspect-[4/3] lg:aspect-auto lg:flex-1 ${currentAmbient.bg} flex items-center justify-center overflow-hidden relative p-6 sm:p-8`}
                onClick={() => zoom === 1 && handleZoomIn()}
              >
                {/* Decoraciones de ambiente */}
                {activeAmbient === 'living' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-100/60 to-transparent" />
                    <div className="absolute bottom-6 left-10 text-5xl opacity-30">🛋️</div>
                    <div className="absolute bottom-6 right-10 text-4xl opacity-25">🪴</div>
                  </div>
                )}
                {activeAmbient === 'tree' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-100/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 text-5xl opacity-30">🎄</div>
                    <div className="absolute bottom-6 right-8 text-3xl opacity-25">🎁</div>
                  </div>
                )}
                {activeAmbient === 'office' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-slate-100/60 to-transparent" />
                    <div className="absolute bottom-6 left-10 text-4xl opacity-25">🪑</div>
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

              {/* Barra de herramientas (zoom + ambientes) */}
              <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2 py-1">
                  <button onClick={handleZoomOut} disabled={zoom <= 1}
                    className="p-1 rounded-full hover:bg-white disabled:opacity-30 transition-colors cursor-pointer">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-brand-dark w-8 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={handleZoomIn} disabled={zoom >= 3}
                    className="p-1 rounded-full hover:bg-white disabled:opacity-30 transition-colors cursor-pointer">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                  {AMBIENTS.map((amb) => (
                    <button
                      key={amb.id}
                      onClick={() => setActiveAmbient(amb.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border ${
                        activeAmbient === amb.id
                          ? 'bg-brand-pink text-white border-brand-pink shadow-sm'
                          : 'bg-white text-brand-gray border-gray-200 hover:border-brand-pink-light'
                      }`}
                    >
                      <span>{amb.emoji}</span>
                      <span className="hidden sm:inline">{amb.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== INFO — en mobile fluye debajo, en desktop es columna derecha ===== */}
            <div className="lg:w-[420px] xl:w-[460px] lg:flex lg:flex-col lg:border-l border-gray-100 bg-white">
              <div className="lg:flex-1 lg:overflow-y-auto">
                {/* Titulo */}
                <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4">
                  <h1 className="font-heading text-xl sm:text-2xl lg:text-[26px] font-bold text-brand-dark leading-snug">
                    {product.name}
                  </h1>
                </div>

                <div className="mx-5 sm:mx-7 border-b border-gray-100" />

                {/* Descripcion */}
                <div className="px-5 sm:px-7 py-4">
                  <p className="text-brand-gray leading-relaxed text-sm sm:text-[15px]">
                    {product.description}
                  </p>
                </div>

                <div className="mx-5 sm:mx-7 border-b border-gray-100" />

                {/* Personalizable */}
                {product.customizable && (
                  <>
                    <div className="px-5 sm:px-7 py-4">
                      <div className="bg-gradient-to-br from-brand-purple/5 via-brand-pink/5 to-brand-purple/10 border border-brand-purple/15 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-brand-purple to-brand-pink p-2.5 rounded-lg shadow-md shrink-0">
                            <Palette className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-brand-purple text-sm mb-1">Este producto es personalizable</h3>
                            <p className="text-xs text-brand-gray leading-relaxed">
                              Elige colores, nombres, detalles y más.
                              Escríbenos por WhatsApp y creamos algo único para ti.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mx-5 sm:mx-7 border-b border-gray-100" />
                  </>
                )}

                {/* Precio */}
                <div className="px-5 sm:px-7 py-4">
                  <p className="text-[10px] font-semibold text-brand-gray uppercase tracking-wider mb-2">Precio</p>
                  {hasPrice ? (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-heading text-2xl sm:text-3xl font-bold text-brand-pink">
                        {formatPrice(finalPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-base text-brand-gray line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-brand-amber/10 to-brand-amber/5 border border-brand-amber/25 rounded-xl px-4 py-3">
                      <span className="font-heading text-base font-bold text-brand-dark block">Precio a consultar</span>
                      <p className="text-xs text-brand-gray mt-0.5">Escríbenos para cotizar este producto</p>
                    </div>
                  )}
                  {hasDiscount && hasPrice && (
                    <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg mt-2">
                      <Star className="w-3.5 h-3.5" />
                      Ahorras {formatPrice(product.price - finalPrice)}
                    </div>
                  )}
                </div>

                <div className="mx-5 sm:mx-7 border-b border-gray-100" />

                {/* Garantías */}
                <div className="px-5 sm:px-7 py-4">
                  <p className="text-[10px] font-semibold text-brand-gray uppercase tracking-wider mb-3">Nuestras garantías</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: HandHeart, label: 'Hecho a mano', sub: 'Con amor y dedicación', color: 'text-brand-pink bg-brand-pink/10' },
                      { icon: Star, label: 'Alta calidad', sub: 'Materiales premium', color: 'text-brand-amber bg-brand-amber/10' },
                      { icon: Truck, label: 'Envío Bogotá', sub: 'Entrega a domicilio', color: 'text-brand-purple bg-brand-purple/10' },
                      { icon: MessageCircle, label: 'Atención directa', sub: 'Respuesta rápida', color: 'text-green-600 bg-green-50' },
                    ].map((feat, i) => (
                      <div key={i} className="bg-gray-50/80 border border-gray-100 rounded-xl p-3 flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${feat.color}`}>
                          <feat.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-brand-dark leading-tight">{feat.label}</p>
                          <p className="text-[10px] text-brand-gray mt-0.5">{feat.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones fijos */}
              <div className="border-t border-gray-200 px-5 sm:px-7 py-4 space-y-2.5 bg-gray-50/50">
                {hasPrice ? (
                  <button
                    onClick={() => { onAddToCart(product); handleClose(); }}
                    className="w-full bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-sm shadow-md"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Agregar al carrito
                  </button>
                ) : (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm shadow-md">
                    <MessageCircle className="w-5 h-5" />
                    Consultar por WhatsApp
                  </a>
                )}
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  className="w-full bg-white border-2 border-green-400 text-green-700 font-semibold py-3 rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 text-xs">
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
