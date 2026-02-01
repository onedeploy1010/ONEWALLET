/**
 * ONE Dashboard Type Definitions
 */

// ============ Auth Types ============

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// ============ Project Types ============

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  apiKey: string;
  apiSecret?: string;
  settings: ProjectSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  allowedDomains: string[];
  rateLimit: number;
  features: ProjectFeatures;
  webhookUrl?: string;
}

export interface ProjectFeatures {
  wallet: boolean;
  swap: boolean;
  contracts: boolean;
  fiat: boolean;
  payments: boolean;
  quant: boolean;
}

export interface ProjectStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  volumeUsd: number;
  lastActivity?: string;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

// ============ Ecosystem Types ============

export interface EcosystemApp {
  id: string;
  name: string;
  slug: string;
  description?: string;
  supabaseUrl?: string;
  supabaseProjectId?: string;
  apiEndpoint?: string;
  isActive: boolean;
  syncConfig: SyncConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SyncConfig {
  syncUsers: boolean;
  syncWallets: boolean;
  syncTransactions: boolean;
  syncIntervalSeconds: number;
}

// ============ Migration Types ============

export interface MigrationJob {
  id: string;
  sourceApp: string;
  targetApp: string;
  status: MigrationStatus;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors: MigrationError[];
  startedAt: string;
  completedAt?: string;
}

export type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface MigrationError {
  recordId: string;
  error: string;
  timestamp: string;
}

export interface MigrationConfig {
  sourceDatabase: DatabaseConnection;
  targetDatabase: DatabaseConnection;
  tables: string[];
  batchSize: number;
  dryRun: boolean;
}

export interface DatabaseConnection {
  type: 'supabase' | 'postgres' | 'ipv4';
  url: string;
  apiKey?: string;
  ipv4?: string;
  port?: number;
}

// ============ Dashboard Stats ============

export interface DashboardStats {
  overview: OverviewStats;
  users: UserStats;
  transactions: TransactionStats;
  projects: ProjectStatsOverview;
  growth: GrowthData;
}

export interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalVolume: number;
}

export interface UserStats {
  total: number;
  new24h: number;
  active7d: number;
  byTier: Record<string, number>;
}

export interface TransactionStats {
  total: number;
  today: number;
  volume24h: number;
  avgValue: number;
}

export interface ProjectStatsOverview {
  total: number;
  active: number;
  topProjects: Array<{
    id: string;
    name: string;
    users: number;
    volume: number;
  }>;
}

export interface GrowthData {
  users: number[];
  transactions: number[];
  volume: number[];
  labels: string[];
}

// ============ API Types ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    cached?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ AI Trading Types ============

export interface AiStrategy {
  id: string;
  name: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'stopped';
  description?: string;
  tvl: number;
  winRate: number;
  sharpeRatio: number;
  totalPnl: number;
  maxDrawdown: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiOrder {
  id: string;
  userId: string;
  strategyId: string;
  strategyName?: string;
  amount: number;
  shares: number;
  status: 'pending' | 'active' | 'redeemed' | 'cancelled';
  pnl: number;
  pnlPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiStrategyPool {
  id: string;
  strategyId: string;
  totalDeposits: number;
  totalShares: number;
  navPerShare: number;
  utilizationRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiOpenPosition {
  id: string;
  strategyId: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
}

export interface AiDecisionLog {
  id: string;
  strategyId: string;
  strategyName?: string;
  action: string;
  symbol: string;
  confidence: number;
  executed: boolean;
  pnl?: number;
  reasoning?: string;
  createdAt: string;
}

export interface AiOrderShare {
  id: string;
  orderId: string;
  shares: number;
  navAtEntry: number;
  navAtExit?: number;
}

export interface AiPerformanceSnapshot {
  id: string;
  strategyId: string;
  nav: number;
  tvl: number;
  pnl: number;
  drawdown: number;
  snapshotDate: string;
}

export interface AiOverviewStats {
  totalAum: number;
  totalStrategies: number;
  activeStrategies: number;
  totalOrders: number;
  avgWinRate: number;
  avgSharpe: number;
  totalProfit: number;
}

// ============ Forex Types ============

export interface ForexInvestment {
  id: string;
  userId: string;
  amount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  pairs: string;
  cycleDays: number;
  status: 'active' | 'matured' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface ForexTrade {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  lots: number;
  pips: number;
  pnl: number;
  status: 'open' | 'closed' | 'cancelled';
  openedAt: string;
  closedAt?: string;
}

export interface ForexPool {
  id: string;
  name: string;
  type: string;
  poolSize: number;
  utilization: number;
  allocation: Record<string, number>;
  status: 'active' | 'paused';
  createdAt: string;
}

export interface ForexDailySnapshot {
  id: string;
  poolId?: string;
  totalInvested: number;
  totalValue: number;
  pnl: number;
  tradeCount: number;
  snapshotDate: string;
}

export interface ForexOverviewStats {
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  activeInvestments: number;
  totalTrades: number;
  avgCycleDays: number;
}
