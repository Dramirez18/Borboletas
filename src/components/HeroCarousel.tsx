import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  emoji: string;
}

const slides: Slide[] = [
  {
    title: 'Detalles Hechos con Amor',
    subtitle: 'Regalos artesanales unicos, elaborados a mano con calidad y dedicacion para cada momento especial',
    cta: 'Ver Catalogo',
    gradient: 'from-brand-pink via-brand-purple to-brand-pink-dark',
    emoji: '🦋',
  },
  {
    title: 'Epoca de Navidad',
    subtitle: 'Renos, Papa Noel, munecos de nieve y toda la magia navidena en piezas artesanales',
    cta: 'Ver Navidad',
    gradient: 'from-red-700 via-red-500 to-green-700',
    emoji: '🎄',
  },
  {
    title: 'Epoca de Halloween',
    subtitle: 'Brujas, gatos y espantapajaros adorablemente terrorificos para la noche mas divertida',
    cta: 'Ver Halloween',
    gradient: 'from-orange-600 via-orange-500 to-purple-800',
    emoji: '🎃',
  },
  {
    title: 'Lapices y Cuadernos',
    subtitle: 'Utiles escolares decorados a mano con personajes unicos y llenos de color',
    cta: 'Ver Coleccion',
    gradient: 'from-blue-500 via-cyan-400 to-teal-500',
    emoji: '✏️',
  },
  {
    title: 'Tejidos Artesanales',
    subtitle: 'Piezas tejidas a mano con lana de alta calidad, cada puntada hecha con amor y dedicacion',
    cta: 'Ver Tejidos',
    gradient: 'from-rose-400 via-fuchsia-400 to-violet-500',
    emoji: '🧶',
  },
  {
    title: 'Hasta 50% de Descuento',
    subtitle: 'Aprovecha nuestras ofertas especiales en productos seleccionados',
    cta: 'Ver Ofertas',
    gradient: 'from-brand-purple via-brand-pink to-brand-amber',
    emoji: '🔥',
  },
];

interface HeroCarouselProps {
  onNavigate: (view: string) => void;
}

export default function HeroCarousel({ onNavigate }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = () => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 mt-6">
    <div className="relative overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.5 }}
          className={`bg-gradient-to-r ${slide.gradient} py-20 sm:py-28 px-10 sm:px-20 lg:px-32 text-white relative flex items-center justify-center`}
        >
          {/* Decoracion de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-6xl">{slide.emoji}</div>
            <div className="absolute bottom-4 right-8 text-8xl">{slide.emoji}</div>
            <div className="absolute top-1/2 left-1/4 text-4xl">{slide.emoji}</div>
            <div className="absolute top-1/3 right-1/3 text-5xl">✨</div>
          </div>

          <div className="max-w-[800px] mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Hecho a mano con amor
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl font-bold mb-6 leading-tight"
            >
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl opacity-90 mb-10 max-w-[600px] mx-auto leading-relaxed"
            >
              {slide.subtitle}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => onNavigate('catalog')}
              className="bg-white text-brand-pink font-bold px-8 py-3 rounded-full hover:bg-brand-amber hover:text-brand-dark transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              {slide.cta}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Flechas */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm hover:bg-white/50 p-2 rounded-full transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm hover:bg-white/50 p-2 rounded-full transition-colors cursor-pointer"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              i === current ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
    </div>
  );
}
