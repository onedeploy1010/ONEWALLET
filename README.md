# ONE Ecosystem Monorepo

A unified Web3 infrastructure platform with wallet, dashboard, and API services.

## Project Structure

```
one-ecosystem/
├── one-engine/           # Backend API & SDK (@one-ecosystem/engine)
│   └── Port: 4000       # api.one23.io
├── one-dashboard/        # Admin Dashboard (@one-ecosystem/dashboard)
│   └── Port: 4001       # dashboard.one23.io
├── wallet/
│   ├── one-wallet/      # React Native/Expo Mobile App
│   └── one-wallet-web/  # Next.js Desktop Web App
│       └── Deploy:      # wallet.one23.io
├── packages/
│   └── sdk/             # Shared SDK (@one-ecosystem/sdk)
├── turbo.json           # Turborepo configuration
├── pnpm-workspace.yaml  # pnpm workspace definition
└── ecosystem.config.js  # PM2 deployment configuration
```

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

```bash
# Run all projects in development mode
pnpm dev

# Run specific project
pnpm dev:engine      # Start one-engine on port 4000
pnpm dev:dashboard   # Start one-dashboard on port 4001
pnpm dev:wallet-web  # Start one-wallet-web on port 3000
```

### Building

```bash
# Build all projects
pnpm build

# Build specific project
pnpm build:engine
pnpm build:dashboard
pnpm build:wallet-web
```

### Type Checking & Linting

```bash
pnpm type-check  # Run TypeScript type checking
pnpm lint        # Run ESLint
```

## Packages

### @one-ecosystem/sdk

Shared services, types, and utilities for all ONE ecosystem projects.

```typescript
import {
  initOneSDK,
  SupabaseService,
  PriceService,
  OneEngineClient,
  formatUSD,
  shortenAddress
} from '@one-ecosystem/sdk';

// Initialize SDK
initOneSDK({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  thirdwebClientId: process.env.THIRDWEB_CLIENT_ID,
  oneEngineUrl: 'https://api.one23.io',
});

// Use services
const supabase = new SupabaseService();
const prices = await new PriceService().getPrices(['ETH', 'BTC']);
const engine = new OneEngineClient();
```

### Available Exports

| Export | Description |
|--------|-------------|
| `initOneSDK` | Initialize SDK with configuration |
| `SupabaseService` | Database operations |
| `PriceService` | Token price fetching (CoinGecko) |
| `OneEngineClient` | ONE Engine API client |
| `CHAIN_CONFIGS` | Supported chain configurations |
| `formatUSD`, `formatPercent` | Number formatting utilities |
| `shortenAddress` | Address formatting |
| Types | All shared TypeScript types |

## Deployment

### Production (PM2)

```bash
# Start all services
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Restart services
pm2 restart all
```

### Static Deployment (wallet-web)

```bash
cd wallet/one-wallet-web
pnpm build
# Deploy ./out to wallet.one23.io
```

## Environment Variables

Create `.env.local` in each project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# ONE Engine (for dashboard/backend)
ONE_ENGINE_URL=https://api.one23.io
ONE_CLIENT_ID=one_pk_xxx
ONE_SECRET_KEY=one_sk_xxx  # Backend only
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture.

```
┌─────────────────────────────────────────────────┐
│                ONE Dashboard                     │
│  • Team/Project Management                       │
│  • API Key Generation                           │
│  • Analytics & Usage                            │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                 ONE Engine                       │
│  • REST API (/api/v1/*)                         │
│  • Connect (Auth/Wallet)                        │
│  • Pay (Fiat On-ramp)                          │
│  • Engine (Backend Transactions)                │
└────────────────────────┬────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  One Wallet  │ │ Third-Party  │ │ Third-Party  │
│   (Mobile)   │ │   DApp A     │ │   DApp B     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## License

Proprietary - ONE Ecosystem
