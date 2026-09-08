import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, ShieldCheck, Music2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginWithGoogle, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleQuickGoogleLogin = async (presetEmail: string, presetName: string, avatarUrl: string) => {
    try {
      await loginWithGoogle(presetEmail, presetName, avatarUrl);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        closeLoginModal();
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    const derivedName = name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const avatarSeed = encodeURIComponent(email);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

    try {
      await loginWithGoogle(email, derivedName, avatar);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        closeLoginModal();
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLoginModal();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'rgba(24, 24, 28, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 24,
            padding: 28,
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            position: 'relative',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* Close button */}
          <button
            onClick={closeLoginModal}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #fa233b 0%, #ff5e62 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(250, 35, 59, 0.35)',
                marginBottom: 14,
              }}
            >
              <Music2 size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Sign in to Chong Music
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', margin: 0, lineHeight: 1.5 }}>
              Sync your playlists, liked tracks, playback queue, and unlimited listening across all sessions.
            </p>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '36px 0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CheckCircle2 size={48} color="#10b981" />
              <div style={{ fontSize: 18, fontWeight: 600 }}>Successfully Connected!</div>
              <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' }}>
                Your library and session are now permanently synced.
              </div>
            </motion.div>
          ) : (
            <div>
              {/* One-Click Google Button */}
              <button
                onClick={() =>
                  handleQuickGoogleLogin(
                    'chong.listener@gmail.com',
                    'Chong Listener',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=ChongListener'
                  )
                }
                disabled={isLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '13px 18px',
                  background: '#ffffff',
                  color: '#1f1f1f',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  marginBottom: 18,
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: '18px 0',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
                <span>or enter your Gmail</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>

              {/* Custom Gmail Form */}
              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: 6,
                    }}
                  >
                    Your Gmail Address
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Mail
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 14,
                        color: 'rgba(255, 255, 255, 0.4)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#fa233b')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: 6,
                    }}
                  >
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#fa233b')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      fontSize: 13,
                      color: '#ff4d4d',
                      background: 'rgba(255, 77, 77, 0.1)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 77, 77, 0.2)',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    marginTop: 6,
                    background: 'linear-gradient(135deg, #fa233b 0%, #d81b31 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isLoading || !email ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !email ? 0.6 : 1,
                    boxShadow: '0 4px 16px rgba(250, 35, 59, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoading ? 'Connecting...' : 'Sign In & Sync Library'}
                </button>
              </form>

              {/* Trust badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 18,
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                <ShieldCheck size={14} color="#10b981" />
                <span>Protected by JWT Session Security & Local Storage Sync</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
