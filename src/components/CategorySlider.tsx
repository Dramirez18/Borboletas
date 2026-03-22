import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import type { CategoryInfo } from '../types';
import ProductCard from './ProductCard';

interface CategorySliderProps {
  category: CategoryInfo;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
}

export default function CategorySlider({
  category,
  products,
  onAddToCart,
  onViewDetail,
}: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="pt-10 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Header con gradiente tematico */}
        <div className={`bg-gradient-to-r ${category.gradient} rounded-2xl px-6 sm:px-10 py-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <span className="text-5xl drop-shadow-lg">{category.emoji}</span>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {category.label}
                </h2>
                <p className="text-sm sm:text-base text-white/80 mt-1">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Flechas de navegacion */}
            <div className="hidden sm:flex gap-3 ml-6 flex-shrink-0">
              <button
                onClick={() => scroll('left')}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Slider horizontal de productos */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar pb-2"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
