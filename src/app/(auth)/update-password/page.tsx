'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('Password harus minimal 6 karakter');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Success, redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  };

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
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '900',
            color: 'white',
            lineHeight: 1,
            letterSpacing: '-1px',
            marginBottom: '12px'
          }}>
            TMK
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '32px'
          }}>
            Teknik Muda Klungkung
          </div>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
          }}>
            Silakan buat password baru Anda untuk mulai menggunakan Core System.
          </p>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
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
              Buat Password
            </div>
            <p className="mobile-text-light" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Masukkan password baru untuk akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <label className="form-label required mobile-text-white" htmlFor="password">Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: '8px', position: 'relative' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Lock size={18} />
                  Simpan Password
                </span>
              )}
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
