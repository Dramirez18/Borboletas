import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Mail, User as UserIcon, Phone, MapPin, ShoppingBag, Heart, Truck, Tag } from 'lucide-react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

type ModalStep = 'welcome' | 'login' | 'register' | 'profile';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export default function AuthModal({ isOpen, onClose, user, onLogin, onLogout }: AuthModalProps) {
  const [step, setStep] = useState<ModalStep>(user ? 'profile' : 'welcome');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationForm, setRegistrationForm] = useState<Partial<User>>({
    name: '', email: '', phone: '', address: '', city: 'Bogota',
  });

  // Reset when opening
  const currentStep = user ? 'profile' : step;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      if (!supabase) throw new Error('Supabase no disponible');

      const { data, error } = await supabase
        .from('Client')
        .select('name, email, phone, address, city, role')
        .eq('email', loginEmail.trim().toLowerCase())
        .limit(1)
        .single();

      if (error || !data) {
        setLoginError('Correo no registrado. Quieres crear una cuenta?');
      } else {
        onLogin(data as User);
        setLoginEmail('');
        setLoginError('');
        onClose();
      }
    } catch {
      setLoginError('Error de conexión. Intenta de nuevo.');
    }

    setIsLoggingIn(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationForm.name || !registrationForm.email) return;

    setIsRegistering(true);

    const formData = {
      ...registrationForm,
      email: registrationForm.email!.trim().toLowerCase(),
      role: 'user' as const,
      id: '',
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('Client').upsert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          address: formData.address || '',
          city: formData.city || 'Bogota',
          role: 'user',
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'email' });

        if (error) {
          setLoginError(`Error: ${error.message}`);
          setIsRegistering(false);
          return;
        }
      } catch {
        setLoginError('Error de conexión.');
        setIsRegistering(false);
        return;
      }
    }

    onLogin(formData as User);
    setRegistrationForm({ name: '', email: '', phone: '', address: '', city: 'Bogota' });
    setIsRegistering(false);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    setStep('welcome');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {currentStep !== 'welcome' && currentStep !== 'profile' && (
                <button onClick={() => setStep('welcome')} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <ArrowLeft size={18} className="text-slate-500" />
                </button>
              )}
              <h2 className="font-bold text-lg text-slate-800">
                {currentStep === 'welcome' && 'Bienvenido'}
                {currentStep === 'login' && 'Iniciar sesión'}
                {currentStep === 'register' && 'Crear cuenta'}
                {currentStep === 'profile' && 'Mi cuenta'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {/* ===== WELCOME STEP ===== */}
            {currentStep === 'welcome' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 text-center mb-4">
                  Inicia sesión para acceder a todos los beneficios
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: <Tag size={18} />, label: 'Ofertas exclusivas', color: 'text-pink-500 bg-pink-50' },
                    { icon: <ShoppingBag size={18} />, label: 'Seguimiento de pedidos', color: 'text-purple-500 bg-purple-50' },
                    { icon: <Heart size={18} />, label: 'Favoritos', color: 'text-red-500 bg-red-50' },
                    { icon: <Truck size={18} />, label: 'Envios rapidos', color: 'text-blue-500 bg-blue-50' },
                  ].map(b => (
                    <div key={b.label} className="flex items-center gap-2 p-3 rounded-xl border border-slate-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${b.color}`}>{b.icon}</div>
                      <span className="text-xs font-medium text-slate-600">{b.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep('login')}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark transition-colors cursor-pointer"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => setStep('register')}
                  className="w-full py-3 bg-white text-brand-pink border-2 border-brand-pink rounded-xl font-semibold hover:bg-brand-pink-light/20 transition-colors cursor-pointer"
                >
                  Crear cuenta gratis
                </button>
              </div>
            )}

            {/* ===== LOGIN STEP ===== */}
            {currentStep === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }}
                      placeholder="tu@correo.com"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{loginError}</p>
                    {loginError.includes('registrado') && (
                      <button type="button" onClick={() => { setStep('register'); setRegistrationForm(prev => ({ ...prev, email: loginEmail })); }}
                        className="text-sm text-brand-pink font-semibold mt-1 cursor-pointer hover:underline">
                        Registrarme ahora
                      </button>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isLoggingIn || !loginEmail}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark disabled:opacity-50 transition-colors cursor-pointer">
                  {isLoggingIn ? 'Verificando...' : 'Iniciar sesión'}
                </button>

                <p className="text-center text-sm text-slate-400">
                  No tienes cuenta?{' '}
                  <button type="button" onClick={() => setStep('register')} className="text-brand-pink font-semibold cursor-pointer hover:underline">
                    Registrate
                  </button>
                </p>
              </form>
            )}

            {/* ===== REGISTER STEP ===== */}
            {currentStep === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nombre completo *</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" required autoFocus value={registrationForm.name || ''}
                      onChange={e => setRegistrationForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Correo electrónico *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={registrationForm.email || ''}
                      onChange={e => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@correo.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={registrationForm.phone || ''}
                      onChange={e => setRegistrationForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+57 300 000 0000"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Dirección</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={registrationForm.address || ''}
                      onChange={e => setRegistrationForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Tu dirección en Bogotá"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink" />
                  </div>
                </div>

                {loginError && (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{loginError}</p>
                )}

                <button type="submit" disabled={isRegistering || !registrationForm.name || !registrationForm.email}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark disabled:opacity-50 transition-colors cursor-pointer">
                  {isRegistering ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>

                <p className="text-center text-sm text-slate-400">
                  Ya tienes cuenta?{' '}
                  <button type="button" onClick={() => setStep('login')} className="text-brand-pink font-semibold cursor-pointer hover:underline">
                    Iniciar sesión
                  </button>
                </p>
              </form>
            )}

            {/* ===== PROFILE STEP ===== */}
            {currentStep === 'profile' && user && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-brand-pink-light rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-brand-pink">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-center font-bold text-lg text-slate-800">{user.name}</h3>

                <div className="space-y-3 mt-4">
                  {[
                    { icon: <Mail size={16} />, label: 'Email', value: user.email },
                    { icon: <Phone size={16} />, label: 'Teléfono', value: user.phone || 'No registrado' },
                    { icon: <MapPin size={16} />, label: 'Dirección', value: user.address || 'No registrada' },
                    { icon: <MapPin size={16} />, label: 'Ciudad', value: user.city || 'Bogota' },
                  ].map(field => (
                    <div key={field.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400">{field.icon}</span>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{field.label}</p>
                        <p className="text-sm text-slate-700">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={handleLogout}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors cursor-pointer mt-4">
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
