'use client';

import { useTranslations } from 'next-intl';

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-500',
  POST: 'bg-blue-500/10 text-blue-500',
  PUT: 'bg-amber-500/10 text-amber-500',
  DELETE: 'bg-red-500/10 text-red-500',
};

export default function APIDocsPage() {
  const t = useTranslations('common');

  const apiEndpoints = [
    {
      group: t('apiDocs.groups.authentication'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: t('apiDocs.groups.authDesc'),
      endpoints: [
        { method: 'POST', path: '/api/auth/login', description: 'Authenticate with email + OTP' },
        { method: 'POST', path: '/api/auth/verify', description: 'Verify OTP code' },
        { method: 'POST', path: '/api/auth/refresh', description: 'Refresh access token' },
        { method: 'POST', path: '/api/auth/logout', description: 'Invalidate session' },
      ],
    },
    {
      group: t('apiDocs.groups.wallets'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      description: t('apiDocs.groups.walletsDesc'),
      endpoints: [
        { method: 'GET', path: '/api/wallets', description: 'List all project wallets' },
        { method: 'POST', path: '/api/wallets', description: 'Create new wallet' },
        { method: 'GET', path: '/api/wallets/:id/balance', description: 'Get wallet balance' },
        { method: 'POST', path: '/api/wallets/:id/transfer', description: 'Initiate transfer' },
      ],
    },
    {
      group: t('apiDocs.groups.aiTrading'),
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      description: t('apiDocs.groups.aiTradingDesc'),
      endpoints: [
        { method: 'GET', path: '/api/ai/strategies', description: 'List trading strategies' },
        { method: 'POST', path: '/api/ai/strategies', description: 'Create new strategy' },
        { method: 'GET', path: '/api/ai/orders', description: 'List strategy orders' },
        { method: 'GET', path: '/api/ai/performance', description: 'Get performance metrics' },
      ],
    },
    {
      group: t('apiDocs.groups.forex'),
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      description: t('apiDocs.groups.forexDesc'),
      endpoints: [
        { method: 'GET', path: '/api/forex/investments', description: 'List investments' },
        { method: 'POST', path: '/api/forex/investments', description: 'Create investment' },
        { method: 'GET', path: '/api/forex/trades', description: 'List trades' },
        { method: 'GET', path: '/api/forex/pools', description: 'List liquidity pools' },
      ],
    },
    {
      group: t('apiDocs.groups.payments'),
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      description: t('apiDocs.groups.paymentsDesc'),
      endpoints: [
        { method: 'POST', path: '/api/payments/charge', description: 'Create payment charge' },
        { method: 'GET', path: '/api/payments/transactions', description: 'List transactions' },
        { method: 'GET', path: '/api/payments/:id', description: 'Get payment details' },
        { method: 'POST', path: '/api/payments/refund', description: 'Process refund' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('apiDocs.title')}</h1>
          <p className="text-muted-foreground">
            {t('apiDocs.subtitle')}
          </p>
        </div>
        <a
          href="https://docs.one23.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          {t('apiDocs.fullDocs')}
        </a>
      </div>

      {/* Quick Start */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('apiDocs.quickStart')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-[#2563EB]">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{t('apiDocs.step1Title')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('apiDocs.step1Desc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-[#2563EB]">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{t('apiDocs.step2Title')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('apiDocs.step2Desc')} <code className="px-1 py-0.5 bg-secondary rounded text-[10px]">Authorization: Bearer your_key</code>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-[#2563EB]">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{t('apiDocs.step3Title')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('apiDocs.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">example.js</span>
        </div>
        <pre className="p-6 overflow-x-auto text-sm font-mono">
          <code className="text-foreground/90">
{`const response = await fetch('https://api.one23.io/v1/ai/strategies', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer one_sk_your_secret_key',
    'Content-Type': 'application/json',
    'X-Project-ID': 'your_project_id'
  }
});

const data = await response.json();
console.log(data.strategies);`}
          </code>
        </pre>
      </div>

      {/* API Endpoint Groups */}
      <div className="space-y-6">
        {apiEndpoints.map((group) => (
          <div key={group.group} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Group Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl ${group.bg} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${group.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{group.group}</h3>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="divide-y divide-border">
              {group.endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="px-6 py-3.5 flex items-center gap-4 hover:bg-secondary/20 transition-colors"
                >
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${methodColors[endpoint.method]}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-foreground/80 flex-1">{endpoint.path}</code>
                  <span className="text-xs text-muted-foreground hidden sm:block">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-2xl p-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">{t('apiDocs.needMoreDetails')}</h3>
        <p className="text-white/70 text-sm mb-6">
          {t('apiDocs.docsCtaDesc')}
        </p>
        <a
          href="https://docs.one23.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2563EB] rounded-xl font-semibold hover:bg-white/90 transition-colors"
        >
          {t('apiDocs.viewFullDocs')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}
