import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { signInWithGoogle } from '../lib/storeDb';

interface AuthModalProps {
  isOpen: boolean;
  reason: 'checkout' | 'account';
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, reason, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Google sign-in window was closed before completing.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Please allow popups for this site to continue with Google.');
      } else {
        setErrorMsg('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && onClose()}
            className="fixed inset-0 bg-[#142220]/45 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Sign in to PLAYPEN"
            className="relative z-10 w-full max-w-md rounded-3xl bg-[#FAFAF8] border border-[#142220]/12 shadow-2xl p-5 sm:p-9 text-[#142220]"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close sign-in dialog"
              className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full border border-[#142220]/15 flex items-center justify-center text-[#142220] hover:bg-[#E6EAE4] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              PLAYPEN · Account Sign-In
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-bold leading-tight text-[#142220]"
              style={{ textWrap: 'balance' }}
            >
              {reason === 'checkout'
                ? 'Sign In to Complete Your Order'
                : 'Sign In to PLAYPEN'}
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              {reason === 'checkout'
                ? 'Continue with Google to choose your delivery details, track your order, and finish checkout.'
                : 'Sign in with Google to view your saved addresses, past orders, live delivery tracking, and wishlist.'}
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-2xl bg-[#F7E8E6] border border-[#993A32]/20 px-4 py-3 text-xs font-medium text-[#6F251F]">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-6 w-full min-h-[48px] px-5 py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors inline-flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#FAFAF8"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81z"
                />
              </svg>
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <div className="mt-5 pt-4 border-t border-[#142220]/10 space-y-2 text-xs text-[#4A5B57]">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2B5B51] shrink-0" />
                <span>Fast, secure Google sign-in — no password needed</span>
              </p>
              <p className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2B5B51] shrink-0" />
                <span>Your orders and UAE addresses stay private to your account</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
