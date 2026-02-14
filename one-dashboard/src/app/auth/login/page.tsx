'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabaseAuth } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const sendOTP = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        throw new Error(otpError.message || t('login.failedSendOtp'));
      }

      setOtpSent(true);
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [email, t]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOTP();
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtp('');
    await sendOTP();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify OTP with Supabase Auth
      const { data, error: verifyError } = await supabaseAuth.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError || !data.user || !data.session) {
        throw new Error(verifyError?.message || t('login.invalidOtp'));
      }

      // Verify admin role and set dashboard cookies
      const res = await fetch('/api/auth/supabase-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          accessToken: data.session.access_token,
        }),
      });

      const sessionData = await res.json();

      if (!sessionData.success) {
        // Not an admin — sign out of Supabase and show error
        await supabaseAuth.auth.signOut();
        throw new Error(sessionData.error?.message || t('login.accessDenied'));
      }

      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-primary mb-4">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('login.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
          <h2 className="text-xl font-semibold mb-6 text-foreground">
            {otpSent ? t('login.verifyEmail') : t('login.welcomeBack')}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <Input
                type="email"
                label={t('login.emailLabel')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3"
              >
                {t('login.continueWithEmail')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('login.verificationCode')}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-primary text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder={t('login.codePlaceholder')}
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('login.codeSentTo', { email })}
                </p>
              </div>
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3"
              >
                {t('login.verifySignIn')}
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || loading}
                  className="flex-1"
                >
                  {resendCooldown > 0 ? `${resendCooldown}s` : t('login.resendCode')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setOtpSent(false); setOtp(''); setResendCooldown(0); }}
                  className="flex-1"
                >
                  {t('login.useDifferentEmail')}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <a href="/auth/register" className="text-primary font-medium hover:underline">
              {t('login.createOne')}
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('login.termsFooter')}
        </p>
      </div>
    </div>
  );
}
