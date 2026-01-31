# ONE Ecosystem 配置指南

## 快速开始

### 1. 复制环境变量文件

```bash
cp .env.example .env
```

### 2. 配置必需的环境变量

编辑 `.env` 文件，填入以下必需配置：

```bash
# Supabase 数据库（必需）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Thirdweb（必需 - 由Engine统一管理，用户无需配置）
THIRDWEB_CLIENT_ID=your-thirdweb-client-id
THIRDWEB_SECRET_KEY=your-thirdweb-secret-key

# 安全密钥（必需）
JWT_SECRET=your-32-character-minimum-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

---

## 各模块配置详解

### ONE Engine (API后端)

Engine是整个生态系统的核心API服务。

**环境变量:**
```bash
# 基础配置
NODE_ENV=production
PORT=4000

# 数据库
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Thirdweb - Engine统一管理，分发给所有生态项目
THIRDWEB_CLIENT_ID=xxx
THIRDWEB_SECRET_KEY=xxx

# 可选：AI功能
OPENAI_API_KEY=sk-xxx

# 可选：交易功能
BYBIT_API_KEY=xxx
BYBIT_API_SECRET=xxx

# 可选：法币入金
ONRAMPER_API_KEY=xxx
```

---

### Wallet Web (用户钱包前端)

**重要**: 用户端不需要配置Thirdweb clientId，SDK会自动从Engine获取。

**环境变量:**
```bash
# Engine API地址
NEXT_PUBLIC_ENGINE_URL=http://localhost:4000
NEXT_PUBLIC_ONE_ENGINE_URL=http://localhost:4000/api

# Supabase（用于实时功能）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# 可选：Thirdweb clientId 备用（通常从Engine自动获取）
# NEXT_PUBLIC_THIRDWEB_CLIENT_ID=xxx
```

**在代码中使用SDK:**
```tsx
// app/providers.tsx
'use client';

import { OneThirdwebProvider } from '@one-ecosystem/sdk';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OneThirdwebProvider
      config={{
        // engineUrl 可选，默认从环境变量读取
        engineUrl: process.env.NEXT_PUBLIC_ONE_ENGINE_URL,
        // 开启Gas赞助
        sponsorGas: true,
        // 认证方式配置
        authOptions: {
          email: true,    // 邮箱登录
          google: true,   // Google登录
          apple: true,    // Apple登录
          passkey: true,  // Passkey支持
        },
      }}
    >
      {children}
    </OneThirdwebProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**使用组件:**
```tsx
// app/page.tsx
import {
  OneConnectButton,
  OneWalletBalance,
  OneSendWidget,
  OneSwapWidget,
} from '@one-ecosystem/sdk';

export default function WalletPage() {
  return (
    <div>
      {/* 连接钱包按钮 */}
      <OneConnectButton
        label="连接钱包"
        sponsorGas={true}
      />

      {/* 余额显示 */}
      <OneWalletBalance />

      {/* 发送代币 */}
      <OneSendWidget />

      {/* Token交换 */}
      <OneSwapWidget />
    </div>
  );
}
```

---

### Dashboard (管理后台)

**环境变量:**
```bash
NODE_ENV=production
PORT=4001

# Supabase
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Engine API
ONE_ENGINE_API_URL=http://one-engine:4000

# 认证
JWT_SECRET=xxx
NEXTAUTH_SECRET=xxx
```

---

## Docker部署配置

### 1. 创建环境文件

```bash
# 复制示例文件
cp .env.example .env

# 编辑配置
nano .env
```

### 2. 构建并启动

```bash
# 开发环境（不含nginx）
docker-compose up -d

# 生产环境（含nginx反向代理）
docker-compose --profile production up -d
```

### 3. 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| one-engine | 4000 | API后端 |
| one-dashboard | 4001 | 管理后台 |
| one-wallet-web | 3000 | 用户钱包 |
| redis | 6379 | 缓存 |
| nginx | 80/443 | 反向代理 |

### 4. 域名配置 (nginx)

默认配置的域名:
- `api.one23.io` → Engine API
- `dashboard.one23.io` → Dashboard
- `wallet.one23.io` / `app.one23.io` → Wallet Web

修改域名，编辑 `docker/nginx/nginx.conf`:
```nginx
server {
    listen 80;
    server_name your-api-domain.com;  # 修改为你的域名
    ...
}
```

---

## 开发环境配置

### 1. 安装依赖

```bash
# 安装pnpm
npm install -g pnpm

# 安装所有依赖
pnpm install
```

### 2. 启动开发服务器

```bash
# 启动所有服务
pnpm dev

# 或分别启动
pnpm --filter @one-ecosystem/engine dev    # Engine: localhost:4000
pnpm --filter @one-ecosystem/dashboard dev  # Dashboard: localhost:4001
pnpm --filter one-wallet-web dev            # Wallet: localhost:3000
```

### 3. 构建

```bash
# 构建所有
pnpm build

# 构建SDK
pnpm --filter @one-ecosystem/sdk build
```

---

## Thirdweb配置说明

### 获取Thirdweb API密钥

1. 访问 https://thirdweb.com/dashboard
2. 创建项目
3. 获取 `Client ID` 和 `Secret Key`

### 配置Smart Wallet (Gas赞助)

Engine已预配置支持:
- EIP-4337 Account Abstraction
- Gas Sponsorship（Base链默认开启）
- In-App Wallet（邮箱、社交登录）

**支持的链:**
- Base (默认，chainId: 8453)
- Ethereum (chainId: 1)
- Polygon (chainId: 137)
- Arbitrum (chainId: 42161)
- Optimism (chainId: 10)

---

## SDK组件一览

### 连接钱包
```tsx
<OneConnectButton />           // 完整连接按钮
<OneConnectButtonSimple />     // 简化版（邮箱+Google）
<OneConnectButtonFull />       // 全功能版
```

### 支付/充值
```tsx
<OnePayWidget />               // 支付组件
<OneFundWalletWidget />        // 充值钱包
<OneDirectPayWidget />         // 直接支付
```

### 发送/接收
```tsx
<OneSendWidget />              // 发送代币
<OneSendETHWidget />           // 发送ETH
<OneReceiveWidget />           // 接收（显示二维码）
```

### 资产展示
```tsx
<OneWalletBalance />           // 余额列表
<OneBalanceDisplay />          // 简洁余额显示
<OneNFTGallery />              // NFT展示
```

### 交换
```tsx
<OneSwapWidget />              // Token交换
```

### 交易
```tsx
<OneTransactionButton />       // 交易按钮
<OneSendETHButton />           // 发送ETH按钮
<OneApproveButton />           // 授权按钮
```

---

## 常见问题

### Q: 前端需要配置Thirdweb clientId吗？
**A:** 不需要。SDK会自动从Engine的 `/api/v1/config/thirdweb` 获取。Engine统一管理clientId并分发给所有生态项目。

### Q: 如何启用Gas赞助？
**A:** 在Provider配置中设置 `sponsorGas: true`，Engine会自动处理。

### Q: 支持哪些登录方式？
**A:**
- 邮箱 OTP
- Google
- Apple
- Passkey
- Discord（可选）

### Q: 如何添加新的区块链支持？
**A:** 编辑 `one-engine/src/config/chains.ts` 添加链配置。

---

## 联系支持

- GitHub Issues: https://github.com/anthropics/claude-code/issues
- 文档: 参考 `TODO.md` 和 `FEATURES_ROADMAP.md`
