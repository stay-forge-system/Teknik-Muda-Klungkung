'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Wifi, Camera, Zap, Wind } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError('Email atau password salah. Silakan coba lagi.');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const services = [
    { icon: Camera, label: 'CCTV & Security' },
    { icon: Wifi, label: 'Access Point' },
    { icon: Zap, label: 'Instalasi Listrik' },
    { icon: Wind, label: 'Air Conditioner' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--login-bg)',
    }}>
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #001A4D 0%, #0033A0 50%, #0066FF 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hidden-mobile"
      >
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'white',
              letterSpacing: '-2px',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              TMK
            </div>
            <div style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.9)',
              fontWeight: '700',
              marginBottom: '12px',
              letterSpacing: '-0.5px',
            }}>
              Teknik Muda Klungkung
            </div>
            <div style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '500',
              marginBottom: '48px',
            }}>
              Core System
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <p style={{
              fontSize: '30px',
              fontWeight: '800',
              color: 'white',
              lineHeight: 1.2,
              marginBottom: '16px',
              letterSpacing: '-0.5px',
            }}>
              Innovation is Our Foundation,<br />Growth is Our Future.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '48px',
            }}
          >
            {services.map(({ icon: Icon, label }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon size={20} color="rgba(255,255,255,0.9)" />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          flexShrink: 0,
        }}
      >
        <div className="mobile-form-container" style={{ width: '100%', maxWidth: '360px' }}>
          {/* Mobile Header */}
          <div className="mobile-header" style={{ marginBottom: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: 'white', lineHeight: 1 }}>TMK</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginTop: '4px' }}>Teknik Muda Klungkung</div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <div className="mobile-text-white mobile-welcome-text" style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}>
              Selamat datang
            </div>
            <p className="mobile-text-light" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Masuk ke akun TMK Anda
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="alert alert-error"
              >
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label className="form-label required mobile-text-white" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="nama@perusahaan.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <span className="form-error">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label required mobile-text-white" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">{errors.password.message}</span>
              )}
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Masuk...
                </span>
              ) : 'Masuk'}
            </motion.button>
          </form>

          <style>{`
            :root { --login-bg: linear-gradient(135deg, #FAFAFA 0%, #EBF2FF 100%); }
            @media (prefers-color-scheme: dark) { :root { --login-bg: linear-gradient(135deg, #0A0A0A 0%, #001233 100%); } }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .mobile-header { display: none; }
            @media (max-width: 768px) { 
              :root { --login-bg: linear-gradient(135deg, #001A4D 0%, #0033A0 50%, #0066FF 100%); }
              .hidden-mobile { display: none !important; }
              .mobile-header { display: block; }
              .mobile-text-white { color: white !important; }
              .mobile-text-light { color: rgba(255,255,255,0.8) !important; }
              .form-input { border-color: rgba(255,255,255,0.2) !important; }
              .mobile-form-container { text-align: center; }
              .mobile-form-container .form-label { text-align: left; }
              .mobile-form-container .form-input { text-align: left; }
              .mobile-welcome-text { font-size: 24px !important; }
              .mobile-form-container .btn-primary { 
                background: white !important; 
                color: black !important; 
                font-weight: 800 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
              }
            }
          `}</style>
        </div>
      </motion.div>
    </div>
  );
}
