# ONE Ecosystem 部署指南

## 项目架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ONE Ecosystem                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │ ONE Engine  │    │ Dashboard   │    │   Wallet Applications   │ │
│  │  (Port 4000)│    │ (Port 4001) │    │                         │ │
│  │             │    │             │    │  ┌──────┐ ┌───────────┐ │ │
│  │ • API 60+   │◄───│ • 企业管理  │    │  │Mobile│ │ Web (3000)│ │ │
│  │ • Services  │    │ • API Key   │    │  │(Expo)│ │ (Next.js) │ │ │
│  │ • Auth      │    │ • 用户管理  │    │  └──────┘ └───────────┘ │ │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘ │
│         │                  │                      │                 │
│         └──────────────────┼──────────────────────┘                 │
│                            │                                        │
│                   ┌────────▼────────┐                               │
│                   │ @one-ecosystem  │                               │
│                   │      /sdk       │                               │
│                   └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │ Supabase │       │ Thirdweb │       │  OpenAI  │
   │    DB    │       │  Web3    │       │    AI    │
   └──────────┘       └──────────┘       └──────────┘
```

## 快速开始

### 1. 环境准备

```bash
# 确保 Node.js >= 20 和 pnpm >= 9
node --version  # v20.x.x
pnpm --version  # 9.x.x

# 克隆仓库
git clone https://github.com/your-org/onewallet.git
cd onewallet

# 安装依赖
pnpm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填入实际值
# - Supabase 配置
# - Thirdweb 配置
# - OpenAI 配置
# - 其他服务配置
```

### 3. 开发模式

```bash
# 启动所有服务
pnpm dev

# 或单独启动
pnpm dev:engine      # Engine API (localhost:4000)
pnpm dev:dashboard   # Dashboard (localhost:4001)
pnpm dev:wallet-web  # Wallet Web (localhost:3000)
```

### 4. 构建

```bash
# 构建所有
pnpm build

# 或单独构建
pnpm build:engine
pnpm build:dashboard
pnpm build:wallet-web
```

## 部署方式

### 方式一：PM2 部署（推荐）

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启
pm2 restart all
```

### 方式二：Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 方式三：云平台部署

#### Vercel (推荐用于 Next.js 应用)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署 Engine
cd one-engine && vercel

# 部署 Dashboard
cd one-dashboard && vercel

# 部署 Wallet Web
cd wallet/one-wallet-web && vercel
```

## CI/CD 配置

### GitHub Actions

项目已配置 `.github/workflows/ci.yml`，支持：

1. **自动构建测试** - PR 和 push 时自动运行
2. **Staging 部署** - develop 分支自动部署到测试环境
3. **Production 部署** - main 分支自动部署到生产环境
4. **Docker 镜像构建** - 自动推送到 Docker Hub

### 需要配置的 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

```
# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Thirdweb
THIRDWEB_CLIENT_ID
THIRDWEB_SECRET_KEY

# 服务器部署 (Staging)
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY

# 服务器部署 (Production)
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY

# Docker Hub
DOCKER_USERNAME
DOCKER_PASSWORD
```

## 推送到 GitHub

```bash
# 初始化 Git（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/your-org/onewallet.git

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit: ONE Ecosystem platform"

# 推送到 main 分支
git push -u origin main
```

## 服务端口

| 服务 | 开发端口 | 生产端口 | 描述 |
|-----|---------|---------|------|
| ONE Engine | 4000 | 4000/4002 | API 后端 |
| Dashboard | 4001 | 4001 | 企业管理面板 |
| Wallet Web | 3000 | 80/443 | 钱包 Web 应用 |
| Redis | 6379 | 6379 | 缓存服务 |

## 健康检查

```bash
# Engine
curl http://localhost:4000/api/v1/health

# Dashboard
curl http://localhost:4001/api/health
```

## 常见问题

### Q: 构建失败 "Module not found"
```bash
# 清理并重新安装
pnpm clean
pnpm install
```

### Q: TypeScript 类型错误
```bash
# 运行类型检查
pnpm type-check
```

### Q: 端口已被占用
```bash
# 查找占用端口的进程
lsof -i :4000
# 终止进程
kill -9 <PID>
```
