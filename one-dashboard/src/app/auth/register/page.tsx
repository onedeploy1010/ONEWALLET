'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabaseAuth } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create user record with admin role via API
      const res = await fetch('/api/auth/register-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || t('register.registrationFailed'));
      }

      // Send OTP via Supabase Auth
      const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
        email: formData.email,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        throw new Error(otpError.message || t('register.failedVerificationCode'));
      }

      setStep('otp');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify OTP with Supabase Auth
      const { data, error: verifyError } = await supabaseAuth.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email',
      });

      if (verifyError || !data.user || !data.session) {
        throw new Error(verifyError?.message || t('register.invalidOtp'));
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
        await supabaseAuth.auth.signOut();
        throw new Error(sessionData.error?.message || t('register.accessDenied'));
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
          <h1 className="text-3xl font-bold text-foreground">{t('register.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('register.subtitle')}
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="text"
                name="name"
                label={t('register.fullName')}
                value={formData.name}
                onChange={handleChange}
                placeholder={t('register.namePlaceholder')}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <Input
                type="email"
                name="email"
                label={t('register.emailLabel')}
                value={formData.email}
                onChange={handleChange}
                placeholder={t('register.emailPlaceholder')}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <Input
                type="text"
                name="company"
                label={t('register.companyLabel')}
                value={formData.company}
                onChange={handleChange}
                placeholder={t('register.companyPlaceholder')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3"
              >
                {t('register.createAccount')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('register.verificationCode')}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-primary text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('register.codeSentTo', { email: formData.email })}
                </p>
              </div>
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3"
              >
                {t('register.verifyAndContinue')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('form')}
                className="w-full"
              >
                {t('register.goBack')}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {t('register.alreadyHaveAccount')}{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('register.termsFooter')}
        </p>
      </div>
    </div>
  );
}
