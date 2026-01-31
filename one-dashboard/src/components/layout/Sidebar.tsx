'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { User } from '@/types';

interface SidebarProps {
  user: User;
  teamSlug?: string;
  projectId?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

// Icon components
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Folder: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Contract: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Zap: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Key: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Rocket: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Send: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Radio: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
};

export function Sidebar({ user, teamSlug = 'default', projectId }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['connect', 'contracts', 'engine']);

  const baseUrl = `/dashboard/team/${teamSlug}`;
  const projectUrl = projectId ? `${baseUrl}/${projectId}` : baseUrl;

  const teamNavigation: NavItem[] = [
    { name: 'Overview', href: baseUrl, icon: <Icons.Dashboard /> },
    { name: 'Projects', href: `${baseUrl}/projects`, icon: <Icons.Folder /> },
    { name: 'Usage', href: `${baseUrl}/usage`, icon: <Icons.Chart /> },
    { name: 'Settings', href: `${baseUrl}/settings`, icon: <Icons.Settings /> },
  ];

  const projectNavigation: NavItem[] = [
    { name: 'Overview', href: projectUrl, icon: <Icons.Dashboard /> },
    {
      name: 'Connect',
      href: `${projectUrl}/connect`,
      icon: <Icons.Link />,
      children: [
        { name: 'Analytics', href: `${projectUrl}/connect/analytics`, icon: <Icons.Chart /> },
        { name: 'In-App Wallets', href: `${projectUrl}/connect/in-app-wallets`, icon: <Icons.Wallet /> },
        { name: 'Ecosystem Wallets', href: `${projectUrl}/connect/ecosystem-wallets`, icon: <Icons.Globe /> },
        { name: 'Account Abstraction', href: `${projectUrl}/connect/account-abstraction`, icon: <Icons.Key /> },
        { name: 'Pay', href: `${projectUrl}/connect/pay`, icon: <Icons.CreditCard /> },
      ],
    },
    {
      name: 'Contracts',
      href: `${projectUrl}/contracts`,
      icon: <Icons.Contract />,
      children: [
        { name: 'Deploy', href: `${projectUrl}/contracts/deploy`, icon: <Icons.Rocket /> },
        { name: 'Published', href: `${projectUrl}/contracts/published`, icon: <Icons.Check /> },
        { name: 'Interact', href: `${projectUrl}/contracts/interact`, icon: <Icons.Refresh /> },
      ],
    },
    {
      name: 'Engine',
      href: `${projectUrl}/engine`,
      icon: <Icons.Zap />,
      children: [
        { name: 'Overview', href: `${projectUrl}/engine/overview`, icon: <Icons.Dashboard /> },
        { name: 'Backend Wallets', href: `${projectUrl}/engine/backend-wallets`, icon: <Icons.Key /> },
        { name: 'Transactions', href: `${projectUrl}/engine/transactions`, icon: <Icons.Send /> },
        { name: 'Relayer', href: `${projectUrl}/engine/relayer`, icon: <Icons.Radio /> },
      ],
    },
    {
      name: 'Settings',
      href: `${projectUrl}/settings`,
      icon: <Icons.Settings />,
      children: [
        { name: 'General', href: `${projectUrl}/settings/general`, icon: <Icons.Settings /> },
        { name: 'API Keys', href: `${projectUrl}/settings/api-keys`, icon: <Icons.Key /> },
        { name: 'Domains', href: `${projectUrl}/settings/domains`, icon: <Icons.Globe /> },
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
    <div className="w-72 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ONE Dashboard</h1>
            <p className="text-xs text-muted-foreground">Ecosystem Management</p>
          </div>
        </Link>
      </div>

      {/* Project Selector */}
      {projectId && (
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <Link
            href={`${baseUrl}/projects`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Icons.ArrowLeft />
            <span>All Projects</span>
          </Link>
          <p className="font-semibold mt-2 truncate text-foreground">{projectId}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.includes(item.name.toLowerCase());
            const itemActive = isActive(item.href);

            return (
              <li key={item.name}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.name.toLowerCase())}
                      className={`w-full sidebar-item ${itemActive ? 'text-primary' : 'text-foreground'}`}
                    >
                      <span className={itemActive ? 'text-primary' : 'text-muted-foreground'}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left font-medium">{item.name}</span>
                      <span
                        className={`transition-transform duration-200 text-muted-foreground ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      >
                        <Icons.ChevronRight />
                      </span>
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-3 pl-4 border-l border-border/50 space-y-1">
                        {item.children!.map((child) => (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={`sidebar-item text-sm ${
                                isActive(child.href)
                                  ? 'active'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className="opacity-75">{child.icon}</span>
                              <span>{child.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`sidebar-item ${
                      itemActive ? 'active' : 'text-foreground'
                    }`}
                  >
                    <span className={itemActive ? '' : 'text-muted-foreground'}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-primary">
            {user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
