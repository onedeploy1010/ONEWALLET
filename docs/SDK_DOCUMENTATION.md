# ONE Ecosystem SDK Documentation

Complete guide for integrating ONE Ecosystem features into your application.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Authentication](#authentication)
5. [Wallet Management](#wallet-management)
6. [Swap & Exchange](#swap--exchange)
7. [Buy/Sell Crypto (Onramp/Offramp)](#buysell-crypto)
8. [NFT Management](#nft-management)
9. [Smart Contracts](#smart-contracts)
10. [AI Trading](#ai-trading)
11. [Staking](#staking)
12. [React Integration](#react-integration)
13. [React Native Integration](#react-native-integration)
14. [Error Handling](#error-handling)
15. [API Reference](#api-reference)

---

## Installation

### npm / yarn / pnpm

```bash
# npm
npm install @one-ecosystem/sdk

# yarn
yarn add @one-ecosystem/sdk

# pnpm
pnpm add @one-ecosystem/sdk
```

### Requirements

- Node.js >= 18
- React >= 18 (for React hooks/providers)
- React Native >= 0.72 (for mobile apps)

---

## Quick Start

### Basic Setup

```typescript
import { initOneSDK, createOneEngineClient } from '@one-ecosystem/sdk';

// Initialize SDK
initOneSDK({
  oneEngineUrl: 'https://api.one23.io',
  oneClientId: 'your-client-id',
  oneSecretKey: 'your-secret-key', // Server-side only
});

// Create client
const client = createOneEngineClient();

// Get wallet balance
const balance = await client.getWalletBalance('0x...');
console.log(balance.data?.totalUsd);
```

### React Setup

```tsx
import { OneProvider, useOneWallet } from '@one-ecosystem/sdk';

function App() {
  return (
    <OneProvider
      config={{
        oneEngineUrl: process.env.NEXT_PUBLIC_ENGINE_URL,
        oneClientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      }}
    >
      <WalletDisplay />
    </OneProvider>
  );
}

function WalletDisplay() {
  const { balance, tokens, isLoading } = useOneWallet();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total: ${balance?.totalUsd.toFixed(2)}</h2>
      {tokens.map(token => (
        <div key={token.symbol}>
          {token.symbol}: {token.balance}
        </div>
      ))}
    </div>
  );
}
```

---

## Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_ONE_ENGINE_URL=https://api.one23.io
NEXT_PUBLIC_ONE_CLIENT_ID=your-client-id

# Server-side only
ONE_SECRET_KEY=your-secret-key

# Optional
NEXT_PUBLIC_DEFAULT_CHAIN_ID=8453
```

### Configuration Options

```typescript
interface OneConfig {
  // ONE Engine API URL
  oneEngineUrl: string;

  // Client ID for authentication
  oneClientId: string;

  // Secret key (server-side only)
  oneSecretKey?: string;

  // Supabase configuration (optional)
  supabaseUrl?: string;
  supabaseAnonKey?: string;

  // Default chain ID (optional, default: 8453 Base)
  defaultChainId?: number;
}
```

---

## Authentication

### Email OTP Authentication

```typescript
import { createOneEngineClient } from '@one-ecosystem/sdk';

const client = createOneEngineClient();

// Step 1: Send OTP
const sendResult = await client.sendEmailOtp('user@example.com');
if (!sendResult.success) {
  console.error(sendResult.error?.message);
}

// Step 2: Verify OTP
const verifyResult = await client.verifyEmailOtp('user@example.com', '123456');
if (verifyResult.success) {
  // Save access token
  const { accessToken, refreshToken, user } = verifyResult.data;
  client.setAccessToken(accessToken);

  console.log('Logged in as:', user.email);
}
```

### Wallet Signature Authentication

```typescript
// For Web3 wallets (MetaMask, WalletConnect, etc.)
const message = `Sign in to ONE Ecosystem\n\nNonce: ${Date.now()}`;

// Get signature from user's wallet
const signature = await signer.signMessage(message);

// Verify with backend
const result = await client.authWithWallet(
  walletAddress,
  signature,
  message
);
```

### Token Refresh

```typescript
// Refresh expired token
const result = await client.refreshToken(refreshToken);
if (result.success) {
  client.setAccessToken(result.data.accessToken);
}
```

### React Hook

```tsx
import { useOneAuth } from '@one-ecosystem/sdk';

function LoginForm() {
  const { user, isAuthenticated, sendOtp, verifyOtp, signOut } = useOneAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const handleSendOtp = async () => {
    const result = await sendOtp(email);
    if (result.success) {
      setStep('otp');
    }
  };

  const handleVerify = async () => {
    const result = await verifyOtp(email, otp);
    if (result.success) {
      console.log('Logged in!');
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.email}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      {step === 'email' ? (
        <>
          <input value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={handleSendOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <input value={otp} onChange={e => setOtp(e.target.value)} />
          <button onClick={handleVerify}>Verify</button>
        </>
      )}
    </div>
  );
}
```

---

## Wallet Management

### Create Wallet

```typescript
// Create smart wallet on Base
const result = await client.createWallet(8453, 'smart');

if (result.success) {
  const { wallet, smartAccountAddress, personalAddress } = result.data;
  console.log('Smart Account:', smartAccountAddress);
  console.log('Personal Address:', personalAddress);
}
```

### Get Wallet Balance

```typescript
// Get balance for specific chains
const result = await client.getWalletBalance(
  '0x...',
  [1, 137, 8453] // Ethereum, Polygon, Base
);

if (result.success) {
  console.log('Total USD:', result.data.totalUsd);
  console.log('24h Change:', result.data.change24h);

  result.data.tokens.forEach(token => {
    console.log(`${token.symbol}: ${token.balance} ($${token.balanceUsd})`);
  });
}
```

### Get Portfolio Summary

```typescript
const result = await client.getPortfolioSummary('0x...');

if (result.success) {
  const { totalValue, change24h, tokens } = result.data;
  console.log(`Portfolio: $${totalValue} (${change24h > 0 ? '+' : ''}${change24h})`);
}
```

### Send Transaction

```typescript
const result = await client.sendTransaction({
  to: '0xRecipientAddress',
  amount: '1.5',
  tokenSymbol: 'ETH',
  chainId: 1,
  memo: 'Payment for services',
});

if (result.success) {
  console.log('Transaction ID:', result.data.txId);
  console.log('Status:', result.data.status);

  // Poll for confirmation
  const status = await client.getTransactionStatus(result.data.txId);
}
```

### Import Wallet

```typescript
// Import from private key
const result = await client.importWallet({
  privateKey: '0x...',
  chainId: 8453,
  label: 'My Imported Wallet',
});

// Import from mnemonic
const result = await client.importWallet({
  mnemonic: 'word1 word2 ... word12',
  chainId: 8453,
});
```

### React Hook

```tsx
import { useOneWallet, useWalletBalance } from '@one-ecosystem/sdk';

function WalletDashboard() {
  const {
    balance,
    tokens,
    isLoading,
    fetchBalance,
    address,
    setAddress,
  } = useOneWallet();

  // Or use standalone hook
  const { data: balanceData } = useWalletBalance('0x...', {
    chains: [1, 137, 8453],
    autoRefresh: true,
    refreshInterval: 30000,
  });

  return (
    <div>
      <h2>Total: ${balance?.totalUsd.toFixed(2)}</h2>
      <p>24h: {balance?.changePercent24h.toFixed(2)}%</p>

      <h3>Tokens</h3>
      {tokens.map(token => (
        <div key={`${token.chain}-${token.symbol}`}>
          <img src={token.icon} alt={token.symbol} />
          <span>{token.balance} {token.symbol}</span>
          <span>${token.balanceUsd.toFixed(2)}</span>
          <span className={token.change24h >= 0 ? 'green' : 'red'}>
            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## Swap & Exchange

### Get Swap Quote

```typescript
const quote = await client.getSwapQuote({
  fromToken: 'ETH',
  fromAmount: '1',
  fromChainId: 1,
  toToken: 'USDC',
  toChainId: 1,
  walletAddress: '0x...',
  slippage: 0.5, // 0.5%
});

if (quote.success) {
  console.log('You will receive:', quote.data.toAmount, 'USDC');
  console.log('Rate:', quote.data.rate);
  console.log('Price Impact:', quote.data.priceImpact, '%');
  console.log('Estimated Gas:', quote.data.fees.gas);
}
```

### Execute Swap

```typescript
const result = await client.executeSwap({
  quoteId: quote.data.quoteId,
  walletAddress: '0x...',
});

if (result.success) {
  console.log('Swap ID:', result.data.swapId);

  // Monitor status
  const status = await client.getSwapStatus(result.data.swapId);
  console.log('Status:', status.data.status);
}
```

### Cross-Chain Swap (Bridge)

```typescript
// Get bridge quote
const bridgeQuote = await client.getBridgeQuote({
  fromChainId: 1,        // Ethereum
  toChainId: 137,        // Polygon
  fromToken: 'ETH',
  toToken: 'MATIC',
  amount: '1',
  walletAddress: '0x...',
});

// Execute bridge
const bridgeResult = await client.executeBridge({
  quoteId: bridgeQuote.data.quoteId,
  walletAddress: '0x...',
});

// Monitor bridge status
const bridgeStatus = await client.getBridgeStatus(bridgeResult.data.id);
```

### React Hook

```tsx
import { useOneSwap } from '@one-ecosystem/sdk';

function SwapInterface() {
  const {
    getQuote,
    executeSwap,
    supportedTokens,
    supportedChains,
    quote,
    isLoading,
  } = useOneSwap();

  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');

  const handleGetQuote = async () => {
    await getQuote({
      fromToken,
      fromAmount: amount,
      fromChainId: 1,
      toToken,
      toChainId: 1,
      walletAddress: '0x...',
    });
  };

  const handleSwap = async () => {
    if (quote) {
      const result = await executeSwap(quote.quoteId);
      if (result.success) {
        alert('Swap submitted!');
      }
    }
  };

  return (
    <div>
      <select value={fromToken} onChange={e => setFromToken(e.target.value)}>
        {supportedTokens.map(t => <option key={t.symbol}>{t.symbol}</option>)}
      </select>

      <input
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount"
      />

      <select value={toToken} onChange={e => setToToken(e.target.value)}>
        {supportedTokens.map(t => <option key={t.symbol}>{t.symbol}</option>)}
      </select>

      <button onClick={handleGetQuote} disabled={isLoading}>
        Get Quote
      </button>

      {quote && (
        <div>
          <p>You receive: {quote.toAmount} {toToken}</p>
          <p>Rate: 1 {fromToken} = {quote.rate} {toToken}</p>
          <button onClick={handleSwap}>Swap Now</button>
        </div>
      )}
    </div>
  );
}
```

---

## Buy/Sell Crypto

### Buy Crypto (Onramp)

```typescript
// Get quote
const quotes = await client.getOnrampQuote(
  'USD',     // fiat currency
  100,       // amount
  'ETH',     // crypto
  'card'     // payment method
);

console.log('Available providers:');
quotes.data.forEach(q => {
  console.log(`${q.provider}: ${q.cryptoAmount} ETH for $${q.fiatAmount}`);
});

// Create onramp session (opens payment widget)
const session = await client.createOnrampSession({
  walletAddress: '0x...',
  fiatCurrency: 'USD',
  fiatAmount: 100,
  cryptoCurrency: 'ETH',
});

// Redirect user to widget
window.open(session.data.widgetUrl, '_blank');

// Monitor status
const status = await client.getOnrampStatus(session.data.sessionId);
```

### Sell Crypto (Offramp)

```typescript
// Get offramp quote
const quotes = await client.getOfframpQuote(
  'ETH',      // crypto
  1,          // amount
  'USD',      // fiat currency
  'bank'      // payout method
);

// Create offramp transaction
const result = await client.createOfframpTransaction({
  cryptoCurrency: 'ETH',
  cryptoAmount: 1,
  fiatCurrency: 'USD',
  payoutMethod: 'bank',
  payoutDetails: {
    bankName: 'Chase',
    accountNumber: '****1234',
    routingNumber: '******',
  },
});
```

### React Hook

```tsx
import { useOneOnramp } from '@one-ecosystem/sdk';

function BuyCrypto() {
  const { openOnramp, getQuote, isLoading, widgetUrl } = useOneOnramp();

  const handleBuy = async () => {
    const quotes = await getQuote('USD', 100, 'ETH');

    // Open payment widget
    await openOnramp({
      walletAddress: '0x...',
      fiatCurrency: 'USD',
      fiatAmount: 100,
      cryptoCurrency: 'ETH',
    });
  };

  return (
    <button onClick={handleBuy} disabled={isLoading}>
      Buy ETH
    </button>
  );
}
```

---

## NFT Management

### Get User's NFTs

```typescript
const result = await client.getUserNFTs('0x...', {
  chainId: 1,
  limit: 20,
  offset: 0,
});

result.data.nfts.forEach(nft => {
  console.log(`${nft.name} #${nft.tokenId}`);
  console.log(`Collection: ${nft.collection?.name}`);
  console.log(`Image: ${nft.imageUrl}`);
});
```

### Get NFT Details

```typescript
const nft = await client.getNFTDetails(
  '0xContractAddress',
  '1234',  // tokenId
  1        // chainId
);

console.log('Name:', nft.data.name);
console.log('Description:', nft.data.description);
console.log('Attributes:', nft.data.attributes);
console.log('Floor Price:', nft.data.floorPrice);
```

### Transfer NFT

```typescript
const result = await client.transferNFT({
  contractAddress: '0x...',
  tokenId: '1234',
  chainId: 1,
  to: '0xRecipient',
  tokenType: 'ERC721',
});

console.log('Transaction Hash:', result.data.txHash);
```

---

## Smart Contracts

### Read Contract

```typescript
const result = await client.readContract({
  contractAddress: '0x...',
  chainId: 1,
  functionName: 'balanceOf',
  args: ['0xAddress'],
});

console.log('Balance:', result.data);
```

### Write to Contract

```typescript
const result = await client.writeContract({
  contractAddress: '0x...',
  chainId: 1,
  functionName: 'transfer',
  args: ['0xRecipient', '1000000000000000000'], // 1 token
});

console.log('Transaction Hash:', result.data.txHash);
```

### Deploy Contract

```typescript
const result = await client.deployContract({
  chainId: 8453,
  contractType: 'thirdweb:TokenERC20',
  name: 'My Token',
  symbol: 'MTK',
  constructorArgs: [
    'My Token',
    'MTK',
    1000000n * 10n ** 18n, // 1M initial supply
  ],
});

console.log('Contract Address:', result.data.address);
console.log('Transaction Hash:', result.data.txHash);
```

---

## AI Trading

### Get Strategies

```typescript
const strategies = await client.getStrategies();

strategies.data.forEach(strategy => {
  console.log(`${strategy.name} (${strategy.riskLevel})`);
  console.log(`Expected APY: ${strategy.expectedApyMin}-${strategy.expectedApyMax}%`);
  console.log(`Min Investment: $${strategy.minInvestment}`);
  console.log(`Lock Period: ${strategy.lockPeriodDays} days`);
});
```

### Invest in Strategy

```typescript
const order = await client.createOrder(
  'strategy-id',
  1000,    // amount
  'USDC'   // currency
);

console.log('Order ID:', order.data.id);
console.log('Status:', order.data.status);
console.log('Lock End Date:', order.data.lockEndDate);
```

### Get Portfolio Stats

```typescript
const stats = await client.getPortfolioStats();

console.log('Total Invested:', stats.data.totalInvested);
console.log('Current Value:', stats.data.totalValue);
console.log('Total P&L:', stats.data.totalPnl);
console.log('P&L %:', stats.data.totalPnlPercent);
console.log('Active Positions:', stats.data.activePositions);
```

### React Hook

```tsx
import { useOneTrading } from '@one-ecosystem/sdk';

function TradingDashboard() {
  const {
    strategies,
    orders,
    portfolioStats,
    createOrder,
    isLoading,
  } = useOneTrading();

  return (
    <div>
      <h2>Portfolio</h2>
      <p>Total Value: ${portfolioStats?.totalValue.toFixed(2)}</p>
      <p>P&L: {portfolioStats?.totalPnlPercent.toFixed(2)}%</p>

      <h2>Available Strategies</h2>
      {strategies.map(strategy => (
        <div key={strategy.id}>
          <h3>{strategy.name}</h3>
          <p>Risk: {strategy.riskLevel}</p>
          <p>APY: {strategy.expectedApyMin}-{strategy.expectedApyMax}%</p>
          <button onClick={() => createOrder(strategy.id, 100, 'USDC')}>
            Invest $100
          </button>
        </div>
      ))}

      <h2>My Orders</h2>
      {orders.map(order => (
        <div key={order.id}>
          <p>Strategy: {order.strategyName}</p>
          <p>Amount: ${order.amount}</p>
          <p>Status: {order.status}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Staking

### Get Staking Pools

```typescript
const pools = await client.getStakingPools(8453); // Base chain

pools.data.forEach(pool => {
  console.log(`${pool.name}: ${pool.apy}% APY`);
  console.log(`Token: ${pool.token}`);
  console.log(`Total Staked: ${pool.totalStaked}`);
  console.log(`Lock Period: ${pool.lockPeriod} days`);
});
```

### Stake Tokens

```typescript
const result = await client.stake({
  poolId: 'pool-id',
  amount: 100,
});

console.log('Position ID:', result.data.positionId);
console.log('Transaction:', result.data.txHash);
```

### Claim Rewards

```typescript
const result = await client.claimStakingRewards('position-id');
console.log('Claimed:', result.data.amount);
```

---

## React Integration

### OneProvider

```tsx
import { OneProvider } from '@one-ecosystem/sdk';

function App() {
  return (
    <OneProvider
      config={{
        oneEngineUrl: process.env.NEXT_PUBLIC_ENGINE_URL!,
        oneClientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
      }}
      autoFetchBalance={true}
    >
      <YourApp />
    </OneProvider>
  );
}
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `useOne()` | Access entire SDK context |
| `useOneAuth()` | Authentication state & methods |
| `useOneWallet()` | Wallet balance & tokens |
| `useOneOnramp()` | Buy crypto widget |
| `useOneSwap()` | Token swap |
| `useOneTrading()` | AI trading strategies |
| `useOneEngine()` | Direct engine client access |
| `useWalletBalance()` | Standalone balance hook |
| `useTokenPrice()` | Single token price |
| `useTokenPrices()` | Multiple token prices |

---

## React Native Integration

### Installation

```bash
npm install @one-ecosystem/sdk @react-native-async-storage/async-storage
```

### Setup with AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createCachedEngineClient,
  parseQRCode,
  formatCryptoAmount,
} from '@one-ecosystem/sdk/react-native';

// Create client with persistent storage
const storage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
};

const client = createCachedEngineClient(storage, {
  baseUrl: 'https://api.one23.io',
  clientId: 'your-client-id',
});

// Initialize on app start
await client.initialize();
```

### QR Code Scanning

```typescript
import { parseQRCode } from '@one-ecosystem/sdk/react-native';

function handleQRScan(data: string) {
  const result = parseQRCode(data);

  switch (result.type) {
    case 'address':
      // Navigate to send screen
      navigate('Send', { to: result.parsed.address });
      break;

    case 'payment_request':
      // Show payment confirmation
      navigate('Confirm', {
        to: result.parsed.address,
        amount: result.parsed.amount,
        token: result.parsed.token,
      });
      break;

    case 'wallet_connect':
      // Handle WalletConnect
      handleWalletConnect(result.data);
      break;
  }
}
```

### Deep Linking

```typescript
import { createDeepLinkHandler } from '@one-ecosystem/sdk/react-native';

const deepLinks = createDeepLinkHandler('onewallet');

// Parse incoming deep link
const { type, params } = deepLinks.parse(url);

// Generate deep link for sharing
const shareUrl = deepLinks.generate('payment', {
  address: '0x...',
  amount: '10',
  token: 'USDC',
});
```

---

## Error Handling

### Error Types

```typescript
import { OneSDKError, isOneSDKError } from '@one-ecosystem/sdk';

try {
  const result = await client.sendTransaction({ ... });

  if (!result.success) {
    throw new OneSDKError(result.error.code, result.error.message);
  }
} catch (error) {
  if (isOneSDKError(error)) {
    switch (error.code) {
      case 'INSUFFICIENT_FUNDS':
        alert('Not enough balance');
        break;
      case 'NETWORK_ERROR':
        alert('Network connection failed');
        break;
      case 'UNAUTHORIZED':
        // Redirect to login
        break;
      default:
        alert(error.message);
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired token |
| `INSUFFICIENT_FUNDS` | Not enough balance |
| `INVALID_ADDRESS` | Invalid wallet address |
| `NETWORK_ERROR` | Network request failed |
| `QUOTE_EXPIRED` | Swap/bridge quote expired |
| `SLIPPAGE_EXCEEDED` | Price changed too much |
| `RATE_LIMITED` | Too many requests |

---

## API Reference

### OneEngineClient Methods

Full list of available methods:

#### Authentication
- `sendEmailOtp(email)` - Send OTP to email
- `verifyEmailOtp(email, otp)` - Verify OTP
- `authWithWallet(address, signature, message)` - Wallet auth
- `refreshToken(refreshToken)` - Refresh access token
- `signOut()` - Sign out
- `getCurrentUser()` - Get current user

#### Wallet
- `createWallet(chainId, type)` - Create new wallet
- `getUserWallets(chainId?)` - List user wallets
- `getWalletBalance(address, chainIds?)` - Get balance
- `getPortfolioSummary(address)` - Portfolio overview
- `sendTransaction(params)` - Send transaction
- `getTransactionStatus(txId)` - Check tx status
- `importWallet(params)` - Import wallet
- `exportWallet(walletId, pin)` - Export wallet

#### Swap
- `getSwapQuote(params)` - Get swap quote
- `executeSwap(params)` - Execute swap
- `getSwapStatus(swapId)` - Check swap status
- `getSupportedSwapTokens(chainId?)` - List tokens
- `getSupportedSwapChains()` - List chains

#### Bridge
- `getBridgeQuote(params)` - Get bridge quote
- `executeBridge(params)` - Execute bridge
- `getBridgeStatus(bridgeId)` - Check status
- `getSupportedBridgeRoutes()` - List routes

#### Onramp/Offramp
- `getOnrampQuote(fiat, amount, crypto, method?)` - Buy quote
- `createOnrampSession(params)` - Start buy session
- `getOnrampStatus(sessionId)` - Check status
- `getOfframpQuote(crypto, amount, fiat, method?)` - Sell quote
- `createOfframpTransaction(params)` - Start sell
- `getOfframpStatus(txId)` - Check status

#### NFT
- `getUserNFTs(address, options?)` - List NFTs
- `getNFTDetails(contract, tokenId, chainId)` - NFT details
- `getNFTCollection(contract, chainId)` - Collection info
- `transferNFT(params)` - Transfer NFT

#### Contract
- `getUserContracts(options?)` - List contracts
- `getContractDetails(address, chainId)` - Contract info
- `readContract(params)` - Read contract
- `writeContract(params)` - Write contract
- `deployContract(params)` - Deploy contract

#### Trading
- `getStrategies()` - List AI strategies
- `getStrategy(id)` - Strategy details
- `getPositions()` - User positions
- `createOrder(strategyId, amount, currency)` - Invest
- `getUserOrders()` - List orders
- `getPortfolioStats()` - Portfolio stats
- `createLimitOrder(params)` - Create limit order
- `getLimitOrders(status?)` - List limit orders
- `cancelLimitOrder(orderId)` - Cancel order
- `setPriceAlert(params)` - Set price alert
- `getPriceAlerts()` - List alerts

#### Staking
- `getStakingPools(chainId?)` - List pools
- `getStakingPositions()` - User positions
- `stake(params)` - Stake tokens
- `unstake(params)` - Unstake
- `claimStakingRewards(positionId)` - Claim rewards

#### User
- `getUserProfile()` - Get profile
- `updateUserProfile(updates)` - Update profile
- `getUserSettings()` - Get settings
- `updateUserSettings(updates)` - Update settings

#### Analytics
- `getPortfolioAnalytics(address, period)` - Portfolio history
- `getTransactionAnalytics(address, period)` - Tx analytics

---

## Support

- Documentation: https://docs.one23.io
- GitHub: https://github.com/one-ecosystem/sdk
- Discord: https://discord.gg/one-ecosystem
- Email: support@one23.io
