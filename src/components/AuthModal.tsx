import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Mail, User as UserIcon, Phone, MapPin, ShoppingBag, Heart, Truck, Tag, FileCheck, KeyRound } from 'lucide-react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

type ModalStep = 'welcome' | 'email' | 'otp' | 'completeProfile' | 'profile';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

const OTP_LENGTH = 6;
const OTP_RESEND_SECONDS = 60;

export default function AuthModal({ isOpen, onClose, user, onLogin, onLogout }: AuthModalProps) {
  const [step, setStep] = useState<ModalStep>(user ? 'profile' : 'welcome');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', city: 'Bogota' });

  const currentStep: ModalStep = user ? 'profile' : step;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const resetFlow = () => {
    setStep('welcome');
    setEmail('');
    setOtpCode('');
    setErrorMsg('');
    setInfoMsg('');
    setProfileForm({ name: '', phone: '', address: '', city: 'Bogota' });
    setAcceptedPolicy(false);
    setResendCooldown(0);
  };

  const sendOtp = async (targetEmail: string): Promise<boolean> => {
    if (!supabase) {
      setErrorMsg('Conexión no disponible. Intenta más tarde.');
      return false;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setErrorMsg(error.message.includes('rate limit')
        ? 'Demasiados intentos. Espera unos minutos.'
        : `No se pudo enviar el código: ${error.message}`);
      return false;
    }
    setResendCooldown(OTP_RESEND_SECONDS);
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOtp(true);
    setErrorMsg('');
    setInfoMsg('');

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setErrorMsg('Correo inválido.');
      setIsSendingOtp(false);
      return;
    }

    const ok = await sendOtp(normalized);
    if (ok) {
      setEmail(normalized);
      setStep('otp');
      setInfoMsg(`Te enviamos un código de ${OTP_LENGTH} dígitos a ${normalized}`);
    }
    setIsSendingOtp(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setErrorMsg('');
    const ok = await sendOtp(email);
    if (ok) setInfoMsg(`Código reenviado a ${email}`);
    setIsSendingOtp(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setErrorMsg('Conexión no disponible.'); return; }
    if (otpCode.length !== OTP_LENGTH) { setErrorMsg(`El código tiene ${OTP_LENGTH} dígitos.`); return; }

    setIsVerifyingOtp(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });

    if (error || !data.user) {
      setErrorMsg(error?.message.includes('expired')
        ? 'El código expiró. Solicita uno nuevo.'
        : 'Código incorrecto. Verifica e intenta de nuevo.');
      setIsVerifyingOtp(false);
      return;
    }

    // Look up Client row by email
    const { data: client } = await supabase
      .from('Client')
      .select('name, email, phone, address, city, role')
      .eq('email', email)
      .maybeSingle();

    setIsVerifyingOtp(false);

    if (client) {
      onLogin(client as User);
      resetFlow();
      onClose();
    } else {
      // First-time auth: complete profile
      setStep('completeProfile');
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setErrorMsg('Conexión no disponible.'); return; }
    if (!profileForm.name.trim() || !acceptedPolicy) return;

    setIsSavingProfile(true);
    setErrorMsg('');

    const { error } = await supabase.from('Client').upsert({
      name: profileForm.name.trim(),
      email,
      phone: profileForm.phone.trim(),
      address: profileForm.address.trim(),
      city: profileForm.city.trim() || 'Bogota',
      role: 'user',
      acceptedDataPolicy: true,
      policyAcceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (error) {
      setErrorMsg(`No se pudo guardar el perfil: ${error.message}`);
      setIsSavingProfile(false);
      return;
    }

    onLogin({
      id: '',
      name: profileForm.name.trim(),
      email,
      phone: profileForm.phone.trim(),
      address: profileForm.address.trim(),
      city: profileForm.city.trim() || 'Bogota',
      role: 'user',
    });

    setIsSavingProfile(false);
    resetFlow();
    onClose();
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    onLogout();
    resetFlow();
    onClose();
  };

  if (!isOpen && !showPolicyModal) return null;

  return (
    <div>
    {isOpen && (<AnimatePresence>
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
                <button
                  onClick={() => {
                    if (currentStep === 'email') setStep('welcome');
                    else if (currentStep === 'otp') setStep('email');
                    else if (currentStep === 'completeProfile') setStep('email');
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <ArrowLeft size={18} className="text-slate-500" />
                </button>
              )}
              <h2 className="font-bold text-lg text-slate-800">
                {currentStep === 'welcome' && 'Bienvenido'}
                {currentStep === 'email' && 'Iniciar sesión'}
                {currentStep === 'otp' && 'Verificar código'}
                {currentStep === 'completeProfile' && 'Completar perfil'}
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
                  onClick={() => setStep('email')}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark transition-colors cursor-pointer"
                >
                  Continuar con mi correo
                </button>
                <p className="text-center text-xs text-slate-400">
                  Te enviaremos un código de {OTP_LENGTH} dígitos para verificar tu identidad
                </p>
              </div>
            )}

            {/* ===== EMAIL STEP ===== */}
            {currentStep === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-sm text-slate-500">
                  Ingresa tu correo y te enviaremos un código de acceso.
                </p>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                      placeholder="tu@correo.com"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp || !email}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSendingOtp ? 'Enviando código...' : 'Enviar código'}
                </button>
              </form>
            )}

            {/* ===== OTP STEP ===== */}
            {currentStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 bg-brand-pink-light/30 rounded-2xl flex items-center justify-center">
                    <KeyRound size={22} className="text-brand-pink" />
                  </div>
                </div>

                {infoMsg && (
                  <p className="text-sm text-slate-600 text-center">{infoMsg}</p>
                )}

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 text-center">Código de {OTP_LENGTH} dígitos</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern={`[0-9]{${OTP_LENGTH}}`}
                    maxLength={OTP_LENGTH}
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)); setErrorMsg(''); }}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== OTP_LENGTH}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isVerifyingOtp ? 'Verificando...' : 'Verificar y entrar'}
                </button>

                <div className="text-center text-sm">
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400">Reenviar código en {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                      className="text-brand-pink font-semibold cursor-pointer hover:underline disabled:opacity-50"
                    >
                      Reenviar código
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ===== COMPLETE PROFILE STEP ===== */}
            {currentStep === 'completeProfile' && (
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <p className="text-sm text-slate-500">
                  ¡Bienvenido! Solo necesitamos algunos datos para completar tu perfil.
                </p>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nombre completo *</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      minLength={2}
                      value={profileForm.name}
                      onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+57 300 000 0000"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Dirección</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Calle, número, barrio"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Ciudad</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={e => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Bogotá"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={e => setAcceptedPolicy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-pink focus:ring-brand-pink/30 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    Acepto la{' '}
                    <button type="button" onClick={() => setShowPolicyModal(true)} className="text-brand-pink font-semibold hover:underline">
                      Política de Tratamiento de Datos Personales
                    </button>
                    {' '}de acuerdo con la Ley 1581 de 2012.
                  </span>
                </label>

                {errorMsg && (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSavingProfile || !profileForm.name.trim() || !acceptedPolicy}
                  className="w-full py-3 bg-brand-pink text-white rounded-xl font-semibold hover:bg-brand-pink-dark disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSavingProfile ? 'Guardando...' : 'Continuar'}
                </button>
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

                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors cursor-pointer mt-4"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>)}

    {/* Modal de Política de Datos */}
    {showPolicyModal && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPolicyModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileCheck size={18} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Política de Datos</h3>
            </div>
            <button onClick={() => setShowPolicyModal(false)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={18} /></button>
          </div>
          <div className="p-6 text-sm text-slate-600 space-y-4 leading-relaxed">
            <section>
              <h4 className="font-bold text-slate-800 mb-1">1. Responsable del tratamiento</h4>
              <p><strong>Borboletas</strong> — Detalles hechos con amor<br/>Bogotá, Colombia<br/>Correo: sonillapilla123@gmail.com</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-1">2. Datos personales recopilados</h4>
              <p>Nombre completo, correo electrónico, número de teléfono y dirección de entrega.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-1">3. Finalidad del tratamiento</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestión y seguimiento de pedidos</li>
                <li>Comunicación sobre el estado de tu compra</li>
                <li>Envío de promociones y novedades (solo con tu consentimiento)</li>
                <li>Mejora continua de nuestros servicios</li>
              </ul>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-1">4. Derechos del titular</h4>
              <p>De acuerdo con la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>, tienes derecho a:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Conocer, actualizar y rectificar tus datos personales</li>
                <li>Solicitar prueba de la autorización otorgada</li>
                <li>Ser informado sobre el uso que se le da a tus datos</li>
                <li>Revocar la autorización y/o solicitar la supresión de tus datos</li>
                <li>Presentar quejas ante la SIC por infracciones a la ley</li>
              </ul>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-1">5. Cómo ejercer tus derechos</h4>
              <p>Envía un correo a <strong>sonillapilla123@gmail.com</strong> con el asunto "Datos Personales". Responderemos en un plazo máximo de 15 días hábiles.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-1">6. Seguridad</h4>
              <p>Implementamos medidas técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, pérdida o alteración.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-1">7. Vigencia</h4>
              <p>Esta política es efectiva a partir del 24 de marzo de 2026. Los datos se conservarán mientras exista la relación comercial o hasta que solicites su eliminación.</p>
            </section>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl">
            <button onClick={() => { setAcceptedPolicy(true); setShowPolicyModal(false); }}
              className="w-full py-3 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer">
              Acepto la política de datos
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
