import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const demoIcons: Record<string, { icon: string; gradient: string }> = {
  payments: {
    icon: '💳',
    gradient: 'from-blue-500 to-blue-700',
  },
  wallets: {
    icon: '👛',
    gradient: 'from-[#2563EB] to-[#1D4ED8]',
  },
  forex: {
    icon: '📈',
    gradient: 'from-purple-500 to-purple-700',
  },
};

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ teamSlug: string; demoId: string }>;
}) {
  const { teamSlug, demoId } = await params;
  const t = await getTranslations('common.playground');

  const demoConfig = demoIcons[demoId];
  const validDemoIds = ['payments', 'wallets', 'forex'] as const;
  const isValidDemo = validDemoIds.includes(demoId as typeof validDemoIds[number]);

  if (!demoConfig || !isValidDemo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-6xl mb-6">🔍</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('demoNotFound')}</h1>
        <p className="text-muted-foreground mb-6">{t('demoNotFoundHint')}</p>
        <Link
          href={`/dashboard/team/${teamSlug}`}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t('backToOverview')}
        </Link>
      </div>
    );
  }

  const demoName = t(`demos.${demoId}.name` as const);
  const demoDescription = t(`demos.${demoId}.description` as const);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${demoConfig.gradient} flex items-center justify-center text-4xl shadow-lg mb-6`}>
        {demoConfig.icon}
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">{demoName}</h1>
      <p className="text-muted-foreground max-w-md mb-8">{demoDescription}</p>

      {/* Under construction banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 max-w-lg w-full mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-lg font-semibold text-amber-500">{t('underConstruction')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('underConstructionHint', { name: demoName.toLowerCase() })}
        </p>
      </div>

      <Link
        href={`/dashboard/team/${teamSlug}`}
        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {t('backToOverview')}
      </Link>
    </div>
  );
}
