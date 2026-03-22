import { motion } from 'motion/react';
import { Percent, Gift, Truck } from 'lucide-react';

export default function DiscountBanner() {
  const items = [
    { icon: Percent, text: 'Hasta 50% de descuento' },
    { icon: Gift, text: 'Productos personalizables' },
    { icon: Truck, text: 'Envíos a domicilio en Bogotá' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 mt-6">
    <div className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-amber animate-gradient py-4 px-6 sm:px-8 rounded-xl">
      <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-2 text-white"
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium whitespace-nowrap">{item.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
    </div>
  );
}
