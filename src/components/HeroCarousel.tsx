import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, Star, ArrowRight } from 'lucide-react';
import type { ProductCategory } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

const IMG = 'https://ythsgjjawqzvhewenqex.supabase.co/storage/v1/object/public/productos';

interface Slide {
  key: string;
  label: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  emoji: string;
  image: string;
  category: ProductCategory | null;
  accent: string;
}

const slides: Slide[] = [
  {
    key: 'brand',
    label: 'Muñecos ConSentido',
    title: 'Hechos con el Alma y Corazón',
    subtitle: 'Muñecos y detalles artesanales, elaborados a mano con dedicación para cada momento especial.',
    cta: 'Ver Catálogo',
    gradient: 'from-brand-pink via-brand-purple to-brand-pink-dark',
    emoji: '💗',
    image: `${IMG}/Y2ncqrG4.webp`,
    category: null,
    accent: 'text-brand-pink',
  },
  {
    key: 'navidad',
    label: 'Época de Navidad',
    title: 'La Magia de la Navidad',
    subtitle: 'Papá y Mamá Noel, renos, osos polares y muñecos de nieve para llenar tu hogar de encanto.',
    cta: 'Ver Navidad',
    gradient: 'from-red-700 via-red-600 to-green-700',
    emoji: '🎄',
    image: `${IMG}/XJLR53sP.webp`,
    category: 'navidad',
    accent: 'text-red-600',
  },
  {
    key: 'halloween',
    label: 'Época de Halloween',
    title: 'Dulce o Truco',
    subtitle: 'Brujas, gatos y personajes adorablemente terroríficos para la noche más divertida del año.',
    cta: 'Ver Halloween',
    gradient: 'from-orange-600 via-orange-500 to-purple-800',
    emoji: '🎃',
    image: `${IMG}/rmjB4cf1.webp`,
    category: 'halloween',
    accent: 'text-orange-600',
  },
  {
    key: 'desayunos_sorpresa',
    label: 'Desayunos Sorpresa',
    title: 'Detalles que Enamoran',
    subtitle: 'Figuras y decoración artesanal en foamy para sorprender con un desayuno inolvidable.',
    cta: 'Ver Detalles',
    gradient: 'from-pink-500 via-rose-400 to-amber-400',
    emoji: '🎁',
    image: `${IMG}/wMBScPPp.webp`,
    category: 'desayunos_sorpresa',
    accent: 'text-pink-600',
  },
  {
    key: 'lapices_cuadernos',
    label: 'Punteros y Agendas',
    title: 'Escribe con Estilo',
    subtitle: 'Punteros y agendas decorados a mano con personajes únicos y llenos de color.',
    cta: 'Ver Colección',
    gradient: 'from-blue-500 via-cyan-400 to-teal-500',
    emoji: '✏️',
    image: `${IMG}/B6JWttBX.webp`,
    category: 'lapices_cuadernos',
    accent: 'text-blue-600',
  },
  {
    key: 'tejidos',
    label: 'Tejidos Artesanales',
    title: 'Tejido con Amor',
    subtitle: 'Piezas tejidas a mano con lana de alta calidad, cada puntada hecha con dedicación.',
    cta: 'Ver Tejidos',
    gradient: 'from-rose-400 via-fuchsia-400 to-violet-500',
    emoji: '🧶',
    image: `${IMG}/tRS0CqZJ.webp`,
    category: 'tejidos',
    accent: 'text-fuchsia-600',
  },
];

const AUTOPLAY_MS = 6000;

interface HeroCarouselProps {
  onNavigate: (view: string) => void;
  onSelectCategory: (cat: ProductCategory | null) => void;
}

export default function HeroCarousel({ onNavigate, onSelectCategory }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((i: number, dir: number) => {
    setDirection(dir);
    setCurrent((i + slides.length) % slides.length);
  }, []);

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Autoplay (se pausa al pasar el mouse por encima)
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => nextRef.current(), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, current]);

  const slide = slides[current];

  const handleCta = () => {
    if (slide.category) onSelectCategory(slide.category);
    else onNavigate('catalog');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 mt-6">
      <div
        className="relative overflow-hidden rounded-3xl shadow-xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.key}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className={`relative bg-gradient-to-br ${slide.gradient}`}
          >
            {/* Blobs decorativos */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-28 -left-16 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
              <div className="absolute top-1/3 left-1/4 text-white/10 text-[10rem] leading-none select-none hidden md:block">
                {slide.emoji}
              </div>
            </div>

            {/* Contenido */}
            <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center min-h-[580px] sm:min-h-[460px] lg:min-h-[440px] px-6 sm:px-10 lg:px-16 py-10">
              {/* Texto */}
              <div className="order-2 md:order-1 flex flex-col items-center md:items-start text-center md:text-left text-white">
                <motion.span
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider mb-5"
                >
                  <span className="text-base leading-none">{slide.emoji}</span>
                  {slide.label}
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 drop-shadow-sm"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-base sm:text-lg text-white/90 max-w-md mb-7 leading-relaxed"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
                >
                  <button
                    onClick={handleCta}
                    className={`group inline-flex items-center gap-2 bg-white ${slide.accent} font-bold px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer`}
                  >
                    {slide.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  {slide.category && (
                    <button
                      onClick={() => onNavigate('catalog')}
                      className="inline-flex items-center gap-1.5 text-white/90 font-medium text-sm hover:text-white transition-colors cursor-pointer"
                    >
                      Ver todo el catálogo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>

                {/* Chips de confianza */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 mt-7 text-xs sm:text-sm text-white/80"
                >
                  <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> 100% Artesanal</span>
                  <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4" /> Personalizable</span>
                  <span className="inline-flex items-center gap-1.5">🚚 Envíos en Bogotá</span>
                </motion.div>
              </div>

              {/* Imagen */}
              <div className="order-1 md:order-2 flex justify-center md:justify-end">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
                  transition={{
                    opacity: { duration: 0.5, delay: 0.2 },
                    scale: { duration: 0.5, delay: 0.2 },
                    y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-[22rem] lg:h-[22rem]"
                >
                  {/* Halo suave: aporta brillo y separa la figura del gradiente, sin recuadro blanco */}
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-95" />
                  {/* Imagen recortada (PNG transparente) flotando sobre el gradiente del propio slide */}
                  <img
                    src={slide.image}
                    alt={slide.label}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    className="relative w-full h-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.38)]"
                  />
                  <div className={`absolute -bottom-1 left-1 sm:-left-2 bg-white rounded-full pl-2 pr-4 py-1.5 shadow-lg flex items-center gap-1.5 ${slide.accent}`}>
                    <span className="w-7 h-7 rounded-full bg-current/10 flex items-center justify-center">
                      <Star className={`w-4 h-4 ${slide.accent} fill-current`} />
                    </span>
                    <span className="text-xs font-bold text-brand-dark">Hecho a mano</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/25 backdrop-blur-sm hover:bg-white/45 p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/25 backdrop-blur-sm hover:bg-white/45 p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.key}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              aria-label={`Ir a ${s.label}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === current ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Barra de progreso de autoplay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          {!paused && (
            <motion.div
              key={current}
              className="h-full bg-white/80"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
