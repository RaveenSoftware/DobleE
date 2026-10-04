/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { WaiterView } from './components/Mesero/WaiterView';
import { SuperAdminView } from './components/SuperAdmin/SuperAdminView';
import { LoginPortal } from './components/Auth/LoginPortal';
import { ReceiptModal } from './components/ReceiptModal';
import { CustomerMenu } from './components/CustomerMenu';
import { Order } from './types';
import { motion, AnimatePresence } from 'motion/react';

const appleEase = [0.16, 1, 0.3, 1] as const;

// ─── Pantalla de intro (video + logo) que aparece tras login exitoso ───────────
const IntroScreen: React.FC<{ name: string; onDone: () => void }> = ({ name, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(14px)' }}
      transition={{ duration: 0.55 }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 200, background: '#000' }}
    >
      {/* Video a pantalla completa */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.85 }}
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>

      {/* Overlay suave */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />

      {/* Logo + texto encima del video */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.img
          src="/logo.png"
          alt="Logo DobleE"
          initial={{ scale: 0.55, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 16, delay: 0.25 }}
          className="w-72 h-auto mb-8"
          style={{ filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.65))' }}
        />
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: appleEase, delay: 0.75 }}
          className="text-4xl font-bold text-white tracking-tight"
          style={{ textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}
        >
          Bienvenido a {name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-white/55 text-base mt-3 font-medium"
        >
          Cargando el sistema...
        </motion.p>
      </div>
    </motion.div>
  );
};

// ─── Contenido principal de la app ────────────────────────────────────────────
const MainAppContent: React.FC = () => {
  const { currentUser, config } = useApp();
  const [receiptToView, setReceiptToView] = useState<Order | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const prevUser = React.useRef<typeof currentUser>(null);

  // Detecta cuando el usuario acaba de logearse (de null → user)
  useEffect(() => {
    if (!prevUser.current && currentUser) {
      setShowIntro(true);
    }
    prevUser.current = currentUser;
  }, [currentUser]);

  const isCustomerMenu = new URLSearchParams(window.location.search).has('menu');

  if (isCustomerMenu) {
    return <CustomerMenu />;
  }

  return (
    <>
      {/* Intro de video (overlay sobre todo) */}
      <AnimatePresence>
        {showIntro && (
          <IntroScreen
            name={config.name}
            onDone={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {/* Login */}
      {!currentUser && <LoginPortal />}

      {/* Dashboard */}
      {currentUser && !showIntro && (
        <div className="min-h-screen flex flex-col bg-[#F8F9FD] text-[#0F172A] font-sans">
          <Navbar />
          <main className="flex-1">
            {currentUser.role === 'admin' && (
              <AdminDashboard onViewOrderReceipt={order => setReceiptToView(order)} />
            )}
            {currentUser.role === 'mesero' && <WaiterView />}
            {currentUser.role === 'superadmin' && <SuperAdminView />}
          </main>

          <footer className="mt-12 bg-white border-t border-slate-100 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-display">DobleE POS</span>
                <span aria-hidden="true">·</span>
                <span>{config.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Sesión activa como:</span>
                <strong className="text-slate-800 font-semibold">{currentUser.name}</strong>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </footer>

          <ReceiptModal
            order={receiptToView}
            onClose={() => setReceiptToView(null)}
          />
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
