import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const appleEase = [0.16, 1, 0.3, 1] as const;

export const LoginPortal: React.FC = () => {
  const { login, config, staff } = useApp();

  const [emailOrPin, setEmailOrPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // null = login, 'video' = mostrando video intro, 'done' = entrar al sistema
  const [phase, setPhase] = useState<'login' | 'video' | 'done'>('login');

  // Cuando el video termina su animación, da paso al sistema
  useEffect(() => {
    if (phase === 'video') {
      const timer = setTimeout(() => setPhase('done'), 4000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const isPin = /^\d{1,6}$/.test(emailOrPin);

    try {
      let res;
      if (isPin) {
        const found = staff.find(s => s.pin === emailOrPin);
        res = await login({ role: 'mesero', pin: emailOrPin, staffId: found?.id });
      } else {
        res = await login({ email: emailOrPin, password, role: 'admin' });
      }

      if (res.success) {
        setIsLoading(false);
        setPhase('video');
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Error al conectar con el servidor');
    }
  };

  const isTypingPin = /^\d{1,6}$/.test(emailOrPin);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          FASE 1: PANTALLA DE LOGIN (imagen de fondo, glassmorphism)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 'login' && (
          <motion.div
            key="login-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03, filter: 'blur(12px)' }}
            transition={{ duration: 0.7, ease: appleEase }}
            className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f2027, #1a3a4a, #0f2027)',
            }}
          >
            {/* Imagen de fondo del login */}
            <img
              src="/src/assets/images/granizados_hero_banner_1790537423050.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.65))' }} />

            {/* Tarjeta */}
            <div className="relative z-10 w-full max-w-[390px] px-5">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: appleEase }}
                style={{
                  background: 'rgba(8, 8, 12, 0.72)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '2rem',
                }}
                className="p-8 sm:p-10 shadow-2xl"
              >
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.9, ease: appleEase, delay: 0.15 }}
                  className="flex justify-center mb-5"
                >
                  <img
                    src="/logo.png"
                    alt="Logo DobleE"
                    className="h-20 w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 4px 18px rgba(255,255,255,0.18))' }}
                  />
                </motion.div>

                <div className="text-center mb-8">
                  <h1 className="text-lg font-semibold text-white/90 tracking-tight">
                    Inicia sesión para continuar
                  </h1>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: appleEase }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 p-3.5 rounded-2xl text-sm"
                        style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{errorMessage}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Usuario / PIN */}
                  <div className="relative group">
                    <User
                      className="absolute top-1/2 -translate-y-1/2 text-white/35 group-focus-within:text-blue-400 transition-colors"
                      style={{ left: '1rem', width: '1.1rem', height: '1.1rem' }}
                    />
                    <input
                      type="text"
                      value={emailOrPin}
                      onChange={e => setEmailOrPin(e.target.value)}
                      placeholder="Usuario, email o PIN de mesero"
                      className="w-full py-3.5 text-sm text-white placeholder-white/35 rounded-2xl font-medium focus:outline-none transition-all"
                      style={{
                        paddingLeft: '2.75rem',
                        paddingRight: '1rem',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                      onFocus={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                      onBlur={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                      required
                      autoComplete="username"
                    />
                  </div>

                  {/* Contraseña (solo si no es PIN) */}
                  <AnimatePresence>
                    {!isTypingPin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.38, ease: appleEase }}
                        className="overflow-hidden"
                      >
                        <div className="relative group" style={{ marginTop: '0.75rem' }}>
                          <Lock
                            className="absolute top-1/2 -translate-y-1/2 text-white/35 group-focus-within:text-blue-400 transition-colors"
                            style={{ left: '1rem', width: '1.1rem', height: '1.1rem' }}
                          />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            className="w-full py-3.5 text-sm text-white placeholder-white/35 rounded-2xl font-medium focus:outline-none transition-all"
                            style={{
                              paddingLeft: '2.75rem',
                              paddingRight: '3rem',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.10)',
                            }}
                            onFocus={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                            onBlur={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/75 transition-colors"
                          >
                            {showPassword
                              ? <EyeOff style={{ width: '1.1rem', height: '1.1rem' }} />
                              : <Eye style={{ width: '1.1rem', height: '1.1rem' }} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm cursor-pointer disabled:opacity-60"
                    style={{ background: '#ffffff', color: '#0a0a0a', marginTop: '1rem' }}
                  >
                    {isLoading ? 'Verificando...' : 'Continuar'}
                    {!isLoading && <ArrowRight style={{ width: '1rem', height: '1rem' }} />}
                  </motion.button>
                </form>

                <p className="text-center text-white/20 text-[11px] font-medium mt-7 tracking-widest uppercase">
                  DobleE POS · v3.5
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          FASE 2: VIDEO DE BIENVENIDA (se activa al logearse)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === 'video' && (
          <motion.div
            key="video-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(16px)' }}
            transition={{ duration: 0.6, ease: appleEase }}
            className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
            style={{ zIndex: 100, background: '#000' }}
          >
            {/* Video a pantalla completa */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            >
              <source src="/video.mp4" type="video/mp4" />
            </video>

            {/* Overlay suave */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.38)' }} />

            {/* Logo animado encima del video */}
            <div className="relative z-10 flex flex-col items-center">
              <motion.img
                src="/logo.png"
                alt="Logo DobleE"
                initial={{ scale: 0.5, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.3 }}
                className="w-64 h-auto mb-6"
                style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.6))' }}
              />
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: appleEase, delay: 0.7 }}
                className="text-4xl font-bold text-white tracking-tight"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
              >
                Bienvenido a {config.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="text-white/60 text-base mt-3 font-medium"
              >
                Preparando el sistema...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
