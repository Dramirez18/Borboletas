import { Instagram, MessageCircle, MapPin, Phone } from 'lucide-react';
import { COMPANY } from '../constants';

export default function Footer() {
  const whatsappLink = `https://wa.me/${COMPANY.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(COMPANY.whatsappMessage)}`;

  return (
    <footer className="bg-gradient-to-br from-brand-dark via-brand-purple-dark to-brand-dark text-white mt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={COMPANY.logo}
                alt={COMPANY.name}
                className="w-14 h-14 rounded-full object-contain bg-white/10 p-1"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="font-heading text-xl font-bold block">{COMPANY.name}</span>
                <span className="text-xs text-white/50">{COMPANY.tagline}</span>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-5">
              {COMPANY.slogan}
            </p>
            <div className="flex gap-3">
              <a
                href={COMPANY.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-brand-pink p-2.5 rounded-full transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-green-500 p-2.5 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Contacto</h3>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-pink-light flex-shrink-0" />
                <span>{COMPANY.whatsapp}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-brand-pink-light flex-shrink-0" />
                <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {COMPANY.instagramHandle}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-pink-light flex-shrink-0" />
                <span>{COMPANY.city}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Sobre Nosotros</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>Todo hecho a mano con amor y dedicación</p>
              <p>Materiales de alta calidad</p>
              <p>Productos personalizables</p>
              <p>Envíos a domicilio en Bogotá</p>
              <p>Calidad y servicio garantizados</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/50">
          <p>&copy; {new Date().getFullYear()} {COMPANY.name}. Todos los derechos reservados.</p>
          <p className="mt-1">{COMPANY.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
