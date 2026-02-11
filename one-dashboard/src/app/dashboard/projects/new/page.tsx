'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NewProjectPage() {
  const router = useRouter();
  const t = useTranslations('projects');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || t('new.failedCreate'));
      }

      // Show API key (only shown once)
      setApiKey(data.data.apiKey);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
    }
  };

  // Show API key screen after creation
  if (apiKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold">{t('new.success.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('new.success.description')}
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-600 font-medium mb-2">
              {t('new.success.important')}
            </p>
            <p className="text-xs text-yellow-600/80">
              {t('new.success.importantDesc')}
            </p>
          </div>

          <div className="relative mb-6">
            <label className="block text-sm font-medium mb-2">{t('new.success.apiKey')}</label>
            <div className="flex">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 px-4 py-3 border rounded-l-md bg-secondary font-mono text-sm"
              />
              <button
                onClick={copyApiKey}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-r-md hover:opacity-90"
              >
                {tc('actions.copy')}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard/projects"
              className="flex-1 px-4 py-2 text-center border rounded-md hover:bg-secondary"
            >
              {t('new.success.viewAllProjects')}
            </Link>
            <button
              onClick={() => {
                setApiKey(null);
                setFormData({ name: '', description: '' });
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              {t('new.success.createAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('new.backToProjects')}
        </Link>
      </div>

      <div className="bg-card border rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">{t('new.title')}</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('new.nameLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-background"
              placeholder={t('new.namePlaceholder')}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('new.nameHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('new.descriptionLabel')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-background resize-none"
              rows={4}
              placeholder={t('new.descriptionPlaceholder')}
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard/projects"
              className="flex-1 px-4 py-2 text-center border rounded-md hover:bg-secondary"
            >
              {tc('actions.cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {loading ? tc('status.creating') : t('createProject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
