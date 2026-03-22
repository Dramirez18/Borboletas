import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { COMPANY } from '../constants';

export default function WhatsAppButton() {
  const whatsappLink = `https://wa.me/${COMPANY.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(COMPANY.whatsappMessage)}`;

  return (
    <motion.a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring' }}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
      title="Escríbenos por WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </motion.a>
  );
}
