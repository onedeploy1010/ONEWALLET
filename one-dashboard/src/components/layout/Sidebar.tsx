'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useTranslations } from 'next-intl';
import type { User } from '@/types';

interface SidebarProps {
  user: User;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
  external?: boolean;
  group?: string;
}

// Icon components
const Icons = {
  Dashboard: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Folder: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Contract: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Key: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Rocket: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Brain: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Currency: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ClipboardList: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Target: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M16 3v1.5m0 15V21m-8-12h8m-8 4h8m-9.5-8h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 17.5v-11A1.5 1.5 0 016.5 5z" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  ),
  Cog: () => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('common');
  const teamSlug = (params.teamSlug as string) || 'default';
  const projectId = params.projectId as string | undefined;
  const [expandedSections, setExpandedSections] = useState<string[]>(['configuration', 'ai', 'wallets', 'contracts', 'payments', 'records', 'usage', 'forex']);

  const baseUrl = `/dashboard/team/${teamSlug}`;
  const projectUrl = projectId ? `${baseUrl}/${projectId}` : baseUrl;

  const teamNavigation: NavItem[] = [
    { name: t('nav.overview'), href: baseUrl, icon: <Icons.Dashboard /> },
    { name: t('nav.projects'), href: `${baseUrl}/projects`, icon: <Icons.Folder /> },
    { name: t('nav.aiAgents'), href: `${baseUrl}/agents`, icon: <Icons.Robot /> },
    { name: t('nav.apiDocs'), href: `${baseUrl}/api-docs`, icon: <Icons.BookOpen /> },
    { name: t('nav.docs'), href: 'https://docs.one23.io', icon: <Icons.ExternalLink />, external: true },
  ];

  const projectNavigation: NavItem[] = [
    { name: t('nav.overview'), href: projectUrl, icon: <Icons.Dashboard /> },
    {
      name: t('nav.configuration'),
      href: `${projectUrl}/configuration`,
      icon: <Icons.Cog />,
      children: [
        { name: t('nav.apiKeys'), href: `${projectUrl}/configuration`, icon: <Icons.Key /> },
        { name: t('nav.settings'), href: `${projectUrl}/configuration?tab=settings`, icon: <Icons.Settings /> },
      ],
    },
    {
      name: t('nav.aiTrading'),
      href: `${projectUrl}/ai`,
      icon: <Icons.Brain />,
      children: [
        { name: t('nav.overview'), href: `${projectUrl}/ai`, icon: <Icons.Dashboard /> },
        { name: t('nav.strategies'), href: `${projectUrl}/ai/strategies`, icon: <Icons.Target /> },
        { name: t('nav.orders'), href: `${projectUrl}/ai/orders`, icon: <Icons.Contract /> },
        { name: t('nav.positions'), href: `${projectUrl}/ai/positions`, icon: <Icons.TrendingUp /> },
        { name: t('nav.decisionLog'), href: `${projectUrl}/ai/decisions`, icon: <Icons.ClipboardList /> },
      ],
    },
    {
      name: t('nav.wallets'),
      href: `${projectUrl}/wallets`,
      icon: <Icons.Wallet />,
      children: [
        { name: t('nav.inAppWallets'), href: `${projectUrl}/wallets/in-app`, icon: <Icons.Wallet /> },
        { name: t('nav.backendWallets'), href: `${projectUrl}/wallets/backend`, icon: <Icons.Key /> },
      ],
    },
    {
      name: t('nav.contracts'),
      href: `${projectUrl}/contracts`,
      icon: <Icons.Contract />,
      children: [
        { name: t('nav.deploy'), href: `${projectUrl}/contracts/deploy`, icon: <Icons.Rocket /> },
        { name: t('nav.published'), href: `${projectUrl}/contracts/published`, icon: <Icons.Check /> },
      ],
    },
    {
      name: t('nav.payments'),
      href: `${projectUrl}/payments`,
      icon: <Icons.CreditCard />,
      children: [
        { name: t('nav.pay'), href: `${projectUrl}/payments/pay`, icon: <Icons.CreditCard /> },
      ],
    },
    {
      name: t('nav.records'),
      href: `${projectUrl}/records`,
      icon: <Icons.ClipboardList />,
      children: [
        { name: t('nav.allRecords'), href: `${projectUrl}/records`, icon: <Icons.Dashboard /> },
        { name: t('nav.aiActivity'), href: `${projectUrl}/records/ai`, icon: <Icons.Brain /> },
        { name: t('nav.forexActivity'), href: `${projectUrl}/records/forex`, icon: <Icons.Currency /> },
      ],
    },
    {
      name: t('nav.usage'),
      href: `${projectUrl}/usage`,
      icon: <Icons.Chart />,
      children: [
        { name: t('nav.usageBilling'), href: `${projectUrl}/usage`, icon: <Icons.Chart /> },
      ],
    },
    {
      name: t('nav.forex'),
      href: `${projectUrl}/forex`,
      icon: <Icons.Currency />,
      children: [
        { name: t('nav.overview'), href: `${projectUrl}/forex`, icon: <Icons.Dashboard /> },
        { name: t('nav.investments'), href: `${projectUrl}/forex/investments`, icon: <Icons.Wallet /> },
        { name: t('nav.trades'), href: `${projectUrl}/forex/trades`, icon: <Icons.TrendingUp /> },
        { name: t('nav.pools'), href: `${projectUrl}/forex/pools`, icon: <Icons.Chart /> },
      ],
    },
  ];

  const navigation = projectId ? projectNavigation : teamNavigation;

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name)
        ? prev.filter((s) => s !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === projectUrl || href === baseUrl) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-primary">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">{t('brand.dashboardTitle')}</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">{t('brand.ecosystemManagement')}</p>
          </div>
        </Link>
      </div>

      {/* Project Selector */}
      {projectId && (
        <div className="px-5 py-3 border-b border-border">
          <Link
            href={`${baseUrl}/projects`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Icons.ArrowLeft />
            <span>{t('nav.allProjects')}</span>
          </Link>
          <p className="font-medium text-sm mt-1.5 truncate text-foreground">{projectId}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {!projectId && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('nav.navigation')}
          </p>
        )}
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.includes(item.name.toLowerCase());
            const itemActive = isActive(item.href);

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.name.toLowerCase())}
                      className={`w-full sidebar-item group ${
                        itemActive
                          ? 'text-primary font-medium'
                          : 'text-foreground/80 hover:text-foreground'
                      }`}
                    >
                      <span className={`${itemActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground/70'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.name}</span>
                      <span
                        className={`transition-transform duration-200 text-muted-foreground ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      >
                        <Icons.ChevronRight />
                      </span>
                    </button>
                    {isExpanded && (
                      <ul className="mt-0.5 ml-[15px] pl-3 border-l border-border space-y-0.5">
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`sidebar-item text-xs ${
                                isActive(child.href)
                                  ? 'active font-medium'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className={isActive(child.href) ? '' : 'opacity-60'}>{child.icon}</span>
                              <span>{child.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-item text-foreground/80 hover:text-foreground"
                  >
                    <span className="text-muted-foreground">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`sidebar-item ${
                      itemActive ? 'active font-medium' : 'text-foreground/80 hover:text-foreground'
                    }`}
                  >
                    <span className={itemActive ? '' : 'text-muted-foreground'}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-3 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full sidebar-item text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
          <span className="text-xs">{theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary/50">
          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-foreground">{user.email}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
