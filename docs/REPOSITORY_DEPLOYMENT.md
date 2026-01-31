# ONE Ecosystem - Repository Deployment Guide

本文档说明各个代码仓库的部署策略，包括公开/私有设置和发布配置。

## Repository Overview

| 仓库/包 | 类型 | 可见性 | 发布目标 | 说明 |
|---------|------|--------|----------|------|
| `@one-ecosystem/sdk` | SDK | **Public** | npm | 核心SDK，供第三方集成 |
| `one-engine` | Backend API | **Private** | Docker Registry | 核心后端服务 |
| `one-dashboard` | Web App | **Private** | Vercel/Server | 管理后台 |
| `wallet/one-wallet-web` | Web App | **Private** | Vercel/Server | Web钱包 |
| `wallet/one-wallet` | Mobile App | **Private** | App Store/Play Store | 移动端钱包 |

---

## 1. SDK Package (@one-ecosystem/sdk)

### 可见性: Public (npm)

SDK应该公开发布到npm，供开发者集成ONE生态系统功能。

### npm发布配置

```json
// packages/sdk/package.json
{
  "name": "@one-ecosystem/sdk",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/one-ecosystem/sdk.git"
  }
}
```

### 发布流程

```bash
# 1. 构建SDK
cd packages/sdk
pnpm build

# 2. 更新版本
npm version patch|minor|major

# 3. 发布到npm
npm publish --access public

# 4. 创建Git tag
git tag v1.0.0
git push origin v1.0.0
```

### GitHub Actions 自动发布

```yaml
# .github/workflows/publish-sdk.yml
name: Publish SDK

on:
  push:
    tags:
      - 'sdk-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install
      - run: pnpm --filter @one-ecosystem/sdk build
      - run: pnpm --filter @one-ecosystem/sdk publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 2. ONE Engine (Backend API)

### 可见性: Private

后端API包含敏感的业务逻辑和API密钥配置，必须保持私有。

### 部署配置

**Docker Registry (私有)**
- AWS ECR
- Google Container Registry
- 私有Docker Hub仓库

```dockerfile
# one-engine/Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
```

### 服务器部署

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  one-engine:
    image: your-registry.com/one-engine:latest
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - THIRDWEB_SECRET_KEY=${THIRDWEB_SECRET_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
    restart: always
```

### 环境变量 (机密)

```env
# 不要提交到代码仓库!
THIRDWEB_CLIENT_ID=xxx
THIRDWEB_SECRET_KEY=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
JWT_SECRET=xxx
BYBIT_API_KEY=xxx
BYBIT_API_SECRET=xxx
ONRAMPER_API_KEY=xxx
```

---

## 3. ONE Dashboard (管理后台)

### 可见性: Private

管理后台包含敏感的管理功能和内部API。

### 部署选项

**选项A: Vercel (推荐)**
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1", "hkg1"]
}
```

**选项B: 自托管**
```nginx
# /etc/nginx/sites-available/dashboard
server {
    listen 443 ssl;
    server_name dashboard.one23.io;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### 访问控制

```typescript
// middleware.ts - 仅允许内部访问
export function middleware(request: NextRequest) {
  const allowedIPs = ['办公室IP', 'VPN IP'];
  const clientIP = request.ip;

  if (!allowedIPs.includes(clientIP)) {
    return new Response('Forbidden', { status: 403 });
  }
}
```

---

## 4. Wallet Web (one-wallet-web)

### 可见性: Private (代码), Public (部署)

钱包Web应用部署为公开访问，但源代码保持私有。

### 部署配置

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_ENGINE_URL": "@engine_url",
    "NEXT_PUBLIC_ONE_CLIENT_ID": "@one_client_id"
  }
}
```

### 域名配置

- 生产: `wallet.one23.io`
- 预览: `preview-wallet.one23.io`
- 开发: `dev-wallet.one23.io`

---

## 5. Wallet Mobile (one-wallet)

### 可见性: Private

移动端应用通过应用商店分发。

### iOS 发布

```yaml
# fastlane/Fastfile
lane :release do
  increment_build_number
  build_app(scheme: "OneWallet")
  upload_to_app_store(
    skip_metadata: true,
    skip_screenshots: true
  )
end
```

### Android 发布

```yaml
# fastlane/Fastfile
lane :release do
  gradle(task: "bundleRelease")
  upload_to_play_store(
    track: "production",
    aab: "android/app/build/outputs/bundle/release/app-release.aab"
  )
end
```

### 签名配置

```properties
# android/gradle.properties (不要提交!)
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=one-wallet
MYAPP_UPLOAD_STORE_PASSWORD=xxx
MYAPP_UPLOAD_KEY_PASSWORD=xxx
```

---

## 公司组织配置

### GitHub Organization

```
one-ecosystem/
├── sdk (Public)           - @one-ecosystem/sdk
├── one-engine (Private)   - Backend API
├── one-dashboard (Private)- Admin Dashboard
├── one-wallet (Private)   - Mobile App
├── one-wallet-web (Private)- Web Wallet
└── docs (Public)          - 公开文档
```

### npm Organization

```
@one-ecosystem/
├── sdk                    - 核心SDK
├── react-components       - React组件库 (可选公开)
└── cli                    - 命令行工具 (可选公开)
```

---

## 安全建议

### 1. 密钥管理

- 使用 GitHub Secrets 存储CI/CD密钥
- 使用 Vault/AWS Secrets Manager 管理生产密钥
- 定期轮换API密钥

### 2. 代码安全

- 启用 Dependabot 自动更新依赖
- 使用 CodeQL 扫描安全漏洞
- 配置 Branch Protection Rules

### 3. 访问控制

```yaml
# .github/CODEOWNERS
# SDK
/packages/sdk/ @sdk-team

# Backend
/one-engine/ @backend-team

# Dashboard
/one-dashboard/ @frontend-team @backend-team
```

---

## 版本发布策略

### SDK 版本

遵循语义化版本:
- **Major (x.0.0)**: 破坏性变更
- **Minor (0.x.0)**: 新功能，向后兼容
- **Patch (0.0.x)**: Bug修复

### 应用版本

- **major.minor.patch** for semver
- **Build number** 递增用于商店提交

### 发布分支

```
main           - 生产环境
develop        - 开发环境
release/*      - 发布候选
hotfix/*       - 紧急修复
feature/*      - 功能开发
```

---

## 监控和日志

### 推荐服务

| 服务 | 用途 |
|------|------|
| Sentry | 错误追踪 |
| DataDog / Grafana | 性能监控 |
| LogRocket | 前端会话回放 |
| CloudWatch | AWS日志聚合 |

### 配置示例

```typescript
// SDK 错误上报
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## 快速开始清单

- [ ] 创建 GitHub Organization: `one-ecosystem`
- [ ] 配置 npm Organization: `@one-ecosystem`
- [ ] 设置 GitHub Secrets (NPM_TOKEN, VERCEL_TOKEN, etc.)
- [ ] 配置 Vercel 项目
- [ ] 设置 Docker Registry
- [ ] 配置 App Store Connect / Google Play Console
- [ ] 设置监控服务 (Sentry, etc.)
- [ ] 配置 CODEOWNERS 和 Branch Protection
