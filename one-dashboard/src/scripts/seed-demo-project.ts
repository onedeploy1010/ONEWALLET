/**
 * Seed Demo Project Script
 *
 * Creates a standalone demo project (id: 00000000-0000-0000-0000-000000000002)
 * with fully synthetic sample data, completely isolated from real one-wallet ecosystem.
 *
 * Usage: npx tsx src/scripts/seed-demo-project.ts
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed IDs — demo project is always at this UUID
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000002';
const DEMO_TEAM_ID = '00000000-0000-0000-0000-000000000001';

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('=== ONE Demo Project Seeder ===\n');
  console.log(`Demo Project ID: ${DEMO_PROJECT_ID}`);
  console.log(`Demo Team ID:    ${DEMO_TEAM_ID}\n`);

  // ── Step 1: Ensure demo team exists ──────────────────────────
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('id', DEMO_TEAM_ID)
    .single();

  if (!existingTeam) {
    const { error: teamErr } = await supabase
      .from('teams')
      .insert({
        id: DEMO_TEAM_ID,
        name: 'ONE Demo Team',
        slug: 'demo-team',
      });
    if (teamErr) {
      console.error('Failed to create demo team:', teamErr.message);
      process.exit(1);
    }
    console.log('[+] Created demo team');
  } else {
    console.log('[=] Demo team already exists');
  }

  // ── Step 2: Ensure demo project exists ───────────────────────
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id')
    .eq('id', DEMO_PROJECT_ID)
    .single();

  if (!existingProject) {
    const clientId = `one_pk_demo_${crypto.randomBytes(16).toString('hex')}`;
    const { error: projErr } = await supabase
      .from('projects')
      .insert({
        id: DEMO_PROJECT_ID,
        team_id: DEMO_TEAM_ID,
        name: 'ONE Demo Project',
        slug: 'demo',
        description: 'Explore the ONE Ecosystem with sample data — AI Trading, Forex, Wallets, and Payments.',
        client_id: clientId,
        settings: { is_demo: true },
        status: 'active',
      });
    if (projErr) {
      console.error('Failed to create demo project:', projErr.message);
      process.exit(1);
    }
    console.log('[+] Created demo project');

    // Create demo API key
    const apiKey = `one_sk_demo_${crypto.randomBytes(16).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    await supabase.from('project_api_keys').insert({
      project_id: DEMO_PROJECT_ID,
      name: 'Demo Secret Key',
      key_type: 'secret',
      key_hash: apiKeyHash,
      key_prefix: apiKey.slice(0, 15),
    });
    console.log('[+] Created demo API key');
  } else {
    console.log('[=] Demo project already exists');
  }

  // ── Step 3: Clean old demo data ──────────────────────────────
  console.log('\n--- Cleaning old demo data ---');
  const tables = [
    'ai_orders', 'ai_strategies', 'ai_strategy_pools',
    'forex_trades', 'forex_investments', 'forex_pools',
    'transactions', 'wallets',
  ];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('project_id', DEMO_PROJECT_ID);
    if (error && error.code !== '42P01') {
      console.warn(`  Warning cleaning ${table}: ${error.message}`);
    }
  }
  console.log('[OK] Old demo data cleaned\n');

  // ── Step 4: Seed AI Strategies ───────────────────────────────
  console.log('--- Seeding AI Strategies ---');
  const strategies = [
    {
      project_id: DEMO_PROJECT_ID,
      name: 'Alpha Momentum V3',
      category: 'momentum',
      risk_level: 3,
      is_active: true,
      status: 'active',
      description: 'Multi-timeframe momentum strategy with dynamic stop-loss adjustment',
      tvl: 182450.00,
      win_rate: 62.3,
      sharpe_ratio: 1.85,
      max_drawdown: -8.3,
      total_pnl: 34720.50,
      created_at: randomDate(90),
    },
    {
      project_id: DEMO_PROJECT_ID,
      name: 'Mean Reversion ETH',
      category: 'mean_reversion',
      risk_level: 2,
      is_active: true,
      status: 'active',
      description: 'Statistical arbitrage between ETH spot and perpetual futures',
      tvl: 75600.00,
      win_rate: 71.0,
      sharpe_ratio: 2.12,
      max_drawdown: -4.1,
      total_pnl: 14292.00,
      created_at: randomDate(60),
    },
    {
      project_id: DEMO_PROJECT_ID,
      name: 'Grid Bot BTC/USDT',
      category: 'grid',
      risk_level: 1,
      is_active: true,
      status: 'active',
      description: 'Range-bound grid trading for BTC/USDT with adaptive grid spacing',
      tvl: 48300.00,
      win_rate: 83.5,
      sharpe_ratio: 1.45,
      max_drawdown: -2.8,
      total_pnl: 5989.20,
      created_at: randomDate(120),
    },
    {
      project_id: DEMO_PROJECT_ID,
      name: 'Breakout Scanner Pro',
      category: 'breakout',
      risk_level: 5,
      is_active: false,
      status: 'paused',
      description: 'High-frequency breakout detection across top-20 altcoins',
      tvl: 25000.00,
      win_rate: 48.2,
      sharpe_ratio: 1.10,
      max_drawdown: -15.2,
      total_pnl: 10700.00,
      created_at: randomDate(45),
    },
    {
      project_id: DEMO_PROJECT_ID,
      name: 'DeFi Yield Optimizer',
      category: 'yield',
      risk_level: 2,
      is_active: true,
      status: 'active',
      description: 'Cross-protocol yield farming with automated compounding',
      tvl: 320000.00,
      win_rate: 91.0,
      sharpe_ratio: 2.80,
      max_drawdown: -1.5,
      total_pnl: 70720.00,
      created_at: randomDate(30),
    },
  ];

  const { data: insertedStrategies, error: stratErr } = await supabase
    .from('ai_strategies')
    .insert(strategies)
    .select('id, name');

  if (stratErr) console.error('  [FAIL] ai_strategies:', stratErr.message);
  else console.log(`  [OK] ${insertedStrategies?.length} AI strategies`);

  // ── Step 5: Seed AI Strategy Pools ───────────────────────────
  const strategyIds = insertedStrategies?.map((s) => s.id) || [];

  if (strategyIds.length > 0) {
    const pools = strategyIds.map((stratId) => ({
      strategy_id: stratId,
      project_id: DEMO_PROJECT_ID,
      total_deposits: randomFloat(10000, 100000),
      total_shares: randomFloat(1000, 50000),
      current_nav: randomFloat(1.0, 1.5, 4),
      locked_capital: randomFloat(5000, 50000),
      total_pnl: randomFloat(-2000, 20000),
      created_at: randomDate(60),
    }));

    const { error: poolErr } = await supabase.from('ai_strategy_pools').insert(pools);
    if (poolErr && poolErr.code !== '42P01') console.warn('  [WARN] ai_strategy_pools:', poolErr.message);
    else console.log(`  [OK] ${pools.length} AI strategy pools`);
  }

  // ── Step 6: Seed AI Orders ───────────────────────────────────
  console.log('\n--- Seeding AI Orders ---');
  const demoUsers = Array.from({ length: 5 }, () => crypto.randomUUID());
  const strategyNames = insertedStrategies?.map((s) => s.name) || ['Alpha Momentum V3'];

  const orders = Array.from({ length: 15 }, () => {
    const amount = randomFloat(500, 25000);
    const pnlVal = randomFloat(-1500, 5000);
    return {
      project_id: DEMO_PROJECT_ID,
      user_id: randomChoice(demoUsers),
      strategy_id: randomChoice(strategyIds) || null,
      strategy_name: randomChoice(strategyNames),
      amount,
      shares: randomFloat(10, 5000),
      status: randomChoice(['active', 'active', 'active', 'closed', 'pending']),
      pnl: pnlVal,
      pnl_percent: Number(((pnlVal / amount) * 100).toFixed(2)),
      realized_profit: pnlVal > 0 ? pnlVal * 0.6 : 0,
      unrealized_profit: pnlVal > 0 ? pnlVal * 0.4 : pnlVal,
      created_at: randomDate(30),
    };
  });

  const { error: ordErr } = await supabase.from('ai_orders').insert(orders);
  if (ordErr) console.error('  [FAIL] ai_orders:', ordErr.message);
  else console.log(`  [OK] ${orders.length} AI orders`);

  // ── Step 7: Seed Forex Investments ───────────────────────────
  console.log('\n--- Seeding Forex ---');
  const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'USD/CAD'];

  const investments = Array.from({ length: 8 }, () => {
    const amount = randomFloat(1000, 50000);
    const profitPct = randomFloat(-5, 15);
    const profit = Number((amount * profitPct / 100).toFixed(2));
    return {
      project_id: DEMO_PROJECT_ID,
      user_id: randomChoice(demoUsers),
      amount,
      current_value: Number((amount + profit).toFixed(2)),
      profit,
      profit_percent: profitPct,
      pairs: [randomChoice(currencyPairs), randomChoice(currencyPairs)].filter((v, i, a) => a.indexOf(v) === i),
      cycle_days: Math.floor(Math.random() * 90) + 7,
      status: randomChoice(['active', 'active', 'active', 'matured', 'withdrawn']),
      created_at: randomDate(90),
    };
  });

  const { error: invErr } = await supabase.from('forex_investments').insert(investments);
  if (invErr) console.error('  [FAIL] forex_investments:', invErr.message);
  else console.log(`  [OK] ${investments.length} forex investments`);

  // ── Step 8: Seed Forex Trades ────────────────────────────────
  const trades = Array.from({ length: 15 }, () => {
    const entry = randomFloat(0.6, 160, 5);
    const exitPrice = Number((entry * (1 + randomFloat(-0.03, 0.05))).toFixed(5));
    const lots = randomFloat(0.01, 5.0, 2);
    const pips = Math.round((exitPrice - entry) * 10000);
    return {
      project_id: DEMO_PROJECT_ID,
      pair: randomChoice(currencyPairs),
      side: randomChoice(['buy', 'sell']),
      lots,
      pips,
      entry_price: entry,
      exit_price: exitPrice,
      pnl: randomFloat(-500, 2000),
      status: randomChoice(['completed', 'completed', 'completed', 'pending', 'cancelled']),
      opened_at: randomDate(60),
      closed_at: randomDate(30),
    };
  });

  const { error: tradeErr } = await supabase.from('forex_trades').insert(trades);
  if (tradeErr) console.error('  [FAIL] forex_trades:', tradeErr.message);
  else console.log(`  [OK] ${trades.length} forex trades`);

  // ── Step 9: Seed Forex Pools ─────────────────────────────────
  const forexPools = [
    {
      project_id: DEMO_PROJECT_ID,
      name: 'USD Stable Pool',
      type: 'stable',
      status: 'active',
      pool_size: 1250000.00,
      utilization: 78.5,
      allocation: { 'EUR/USD': 35, 'GBP/USD': 25, 'USD/JPY': 20, 'others': 20 },
      created_at: randomDate(120),
    },
    {
      project_id: DEMO_PROJECT_ID,
      name: 'EUR Growth Pool',
      type: 'growth',
      status: 'active',
      pool_size: 480000.00,
      utilization: 62.0,
      allocation: { 'EUR/USD': 40, 'EUR/GBP': 30, 'EUR/JPY': 30 },
      created_at: randomDate(90),
    },
    {
      project_id: DEMO_PROJECT_ID,
      name: 'Multi-Currency Hedge',
      type: 'hedge',
      status: 'active',
      pool_size: 310000.00,
      utilization: 55.0,
      allocation: { 'USD/CHF': 25, 'AUD/USD': 25, 'NZD/USD': 25, 'USD/CAD': 25 },
      created_at: randomDate(60),
    },
  ];

  const { error: fxPoolErr } = await supabase.from('forex_pools').insert(forexPools);
  if (fxPoolErr) console.error('  [FAIL] forex_pools:', fxPoolErr.message);
  else console.log(`  [OK] ${forexPools.length} forex pools`);

  // ── Step 10: Seed Wallets ────────────────────────────────────
  console.log('\n--- Seeding Wallets & Transactions ---');
  const chains = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'];
  const tokens = ['ETH', 'MATIC', 'BNB', 'USDT', 'USDC'];

  const wallets = chains.map((chain, i) => ({
    project_id: DEMO_PROJECT_ID,
    address: `0x${crypto.randomBytes(20).toString('hex')}`,
    chain,
    type: i < 3 ? 'in_app' : 'backend',
    balance: randomFloat(0.5, 50, 6),
    token_symbol: tokens[i],
    status: 'active',
    created_at: randomDate(60),
  }));

  const { data: insertedWallets, error: walletErr } = await supabase
    .from('wallets')
    .insert(wallets)
    .select('id');

  if (walletErr) console.error('  [FAIL] wallets:', walletErr.message);
  else console.log(`  [OK] ${insertedWallets?.length} wallets`);

  // ── Step 11: Seed Transactions ───────────────────────────────
  const walletIds = insertedWallets?.map((w) => w.id) || [];
  const txTypes = ['transfer', 'deposit', 'withdrawal', 'swap', 'contract_call'] as const;

  const transactions = Array.from({ length: 20 }, () => ({
    project_id: DEMO_PROJECT_ID,
    wallet_id: walletIds.length > 0 ? randomChoice(walletIds) : null,
    user_id: randomChoice(demoUsers),
    type: randomChoice([...txTypes]),
    amount: randomFloat(0.01, 10, 6),
    currency: randomChoice(tokens),
    from_address: `0x${crypto.randomBytes(20).toString('hex')}`,
    to_address: `0x${crypto.randomBytes(20).toString('hex')}`,
    tx_hash: `0x${crypto.randomBytes(32).toString('hex')}`,
    status: randomChoice(['confirmed', 'confirmed', 'confirmed', 'pending', 'failed']),
    gas_used: Math.floor(randomFloat(21000, 500000, 0)),
    created_at: randomDate(30),
  }));

  const { error: txErr } = await supabase.from('transactions').insert(transactions);
  if (txErr) console.error('  [FAIL] transactions:', txErr.message);
  else console.log(`  [OK] ${transactions.length} transactions`);

  // ── Done ─────────────────────────────────────────────────────
  console.log('\n=== Demo project seed completed! ===');
  console.log(`Project ID:  ${DEMO_PROJECT_ID}`);
  console.log('Slug:        demo');
  console.log('This data is fully synthetic and isolated from real ecosystem data.');
}

seed().catch(console.error);
