# ONE Ecosystem Architecture

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ONE Dashboard                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • 创建/管理 Team                                                    │    │
│  │  • 创建/管理 Project (获得 client_id)                                │    │
│  │  • 生成 API Keys (publishable / secret)                             │    │
│  │  • 查看用户、交易、合约、使用量                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 管理API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ONE Engine                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    对外暴露: ONE API / ONE SDK                        │    │
│  │                                                                      │    │
│  │  认证方式:                                                            │    │
│  │  ┌──────────────────────────────────────────────────────────┐       │    │
│  │  │  x-client-id: one_pk_xxxx  (必须)                         │       │    │
│  │  │  x-secret-key: one_sk_xxxx (后端调用时需要)                │       │    │
│  │  └──────────────────────────────────────────────────────────┘       │    │
│  │                                                                      │    │
│  │  API端点:                                                            │    │
│  │  • /api/v1/connect/auth     - 用户认证 (创建In-App Wallet)          │    │
│  │  • /api/v1/connect/users    - 用户列表                               │    │
│  │  • /api/v1/wallet/*         - 钱包操作                               │    │
│  │  • /api/v1/contracts/*      - 合约操作                               │    │
│  │  • /api/v1/pay/*            - 支付/Fiat                             │    │
│  │  • /api/v1/engine/*         - 后端交易                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      │ 内部调用                              │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              内部使用: Thirdweb SDK/API (对外完全隐藏)                  │    │
│  │                                                                      │    │
│  │  • thirdweb Connect - 钱包连接、用户认证                              │    │
│  │  • thirdweb Engine  - 后端交易、Gas Sponsor                          │    │
│  │  • thirdweb Pay     - Fiat On-ramp                                   │    │
│  │                                                                      │    │
│  │  使用ONE自己的 thirdweb_client_id (一个，全局)                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│    One Wallet     │     │   GameFi DApp     │     │    DeFi App       │
│    (Project A)    │     │   (Project B)     │     │   (Project C)     │
│                   │     │                   │     │                   │
│  client_id:       │     │  client_id:       │     │  client_id:       │
│  one_pk_aaa...    │     │  one_pk_bbb...    │     │  one_pk_ccc...    │
│                   │     │                   │     │                   │
│  ┌─────────────┐  │     │  ┌─────────────┐  │     │  ┌─────────────┐  │
│  │ 用户A,B,C   │  │     │  │ 用户D,E,F   │  │     │  │ 用户G,H,I   │  │
│  │ 钱包        │  │     │  │ 钱包        │  │     │  │ 钱包        │  │
│  │ 交易        │  │     │  │ 交易        │  │     │  │ 交易        │  │
│  └─────────────┘  │     │  └─────────────┘  │     │  └─────────────┘  │
└───────────────────┘     └───────────────────┘     └───────────────────┘
     数据隔离                  数据隔离                  数据隔离
```

## 数据库架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Supabase (ONE Engine DB)                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Team & Project层                             │    │
│  │                                                                      │    │
│  │  teams                    projects                project_api_keys   │    │
│  │  ├─ id                    ├─ id                   ├─ id              │    │
│  │  ├─ name                  ├─ team_id (FK)         ├─ project_id (FK) │    │
│  │  ├─ slug                  ├─ name                 ├─ name            │    │
│  │  ├─ owner_id              ├─ client_id ⭐         ├─ key_type        │    │
│  │  └─ billing_plan          ├─ settings             ├─ key_hash        │    │
│  │                           └─ status               └─ permissions     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      │ project_id 隔离                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        用户 & 钱包层 (按Project隔离)                   │    │
│  │                                                                      │    │
│  │  project_users            project_wallets         project_backend_   │    │
│  │  ├─ id                    ├─ id                   wallets            │    │
│  │  ├─ project_id ⭐         ├─ project_id ⭐        ├─ id              │    │
│  │  ├─ email                 ├─ project_user_id      ├─ project_id ⭐   │    │
│  │  ├─ wallet_address        ├─ address              ├─ label           │    │
│  │  ├─ auth_method           ├─ wallet_type          ├─ address         │    │
│  │  ├─ thirdweb_user_id 🔒   ├─ thirdweb_wallet_id 🔒│─ key_type        │    │
│  │  └─ metadata              └─ chain_ids            └─ encrypted_key   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      │ project_id 隔离                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      交易 & 使用量层 (按Project隔离)                   │    │
│  │                                                                      │    │
│  │  project_transactions     project_contracts       api_usage          │    │
│  │  ├─ id                    ├─ id                   ├─ id              │    │
│  │  ├─ project_id ⭐         ├─ project_id ⭐        ├─ project_id ⭐   │    │
│  │  ├─ from_address          ├─ name                 ├─ endpoint        │    │
│  │  ├─ to_address            ├─ address              ├─ method          │    │
│  │  ├─ chain_id              ├─ chain_id             ├─ status_code     │    │
│  │  ├─ status                ├─ abi                  └─ created_at      │    │
│  │  └─ thirdweb_queue_id 🔒  └─ thirdweb_contract_id🔒                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ⭐ = 数据隔离键                                                             │
│  🔒 = 内部字段 (thirdweb关联，对外不暴露)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API调用流程

### 1. 客户端用户认证 (前端调用)

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  前端 App   │                    │ ONE Engine  │                    │  Thirdweb   │
│  (React)    │                    │             │                    │  (内部)     │
└─────────────┘                    └─────────────┘                    └─────────────┘
      │                                   │                                   │
      │  POST /api/v1/connect/auth        │                                   │
      │  Headers:                         │                                   │
      │    x-client-id: one_pk_xxx        │                                   │
      │  Body:                            │                                   │
      │    { method: "email",             │                                   │
      │      email: "user@test.com" }     │                                   │
      │ ─────────────────────────────────>│                                   │
      │                                   │                                   │
      │                                   │  1. 验证 client_id                │
      │                                   │  2. 获取 project_id               │
      │                                   │                                   │
      │                                   │  内部调用 thirdweb                 │
      │                                   │ ─────────────────────────────────>│
      │                                   │                                   │
      │                                   │  返回 thirdweb_user_id            │
      │                                   │  返回 wallet_address              │
      │                                   │ <─────────────────────────────────│
      │                                   │                                   │
      │                                   │  3. 存储到 project_users          │
      │                                   │     (关联 project_id)             │
      │                                   │                                   │
      │  返回:                             │                                   │
      │  { user_id, wallet_address }      │                                   │
      │  (不暴露 thirdweb_user_id)         │                                   │
      │ <─────────────────────────────────│                                   │
      │                                   │                                   │
```

### 2. 后端交易发送 (服务器调用)

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  后端服务    │                    │ ONE Engine  │                    │  Thirdweb   │
│  (Node.js)  │                    │             │                    │  Engine     │
└─────────────┘                    └─────────────┘                    └─────────────┘
      │                                   │                                   │
      │  POST /api/v1/engine/transaction  │                                   │
      │  Headers:                         │                                   │
      │    x-client-id: one_pk_xxx        │                                   │
      │    x-secret-key: one_sk_xxx ⭐    │                                   │
      │  Body:                            │                                   │
      │    { to: "0x...",                 │                                   │
      │      data: "0x...",               │                                   │
      │      chain_id: 137 }              │                                   │
      │ ─────────────────────────────────>│                                   │
      │                                   │                                   │
      │                                   │  1. 验证 secret_key               │
      │                                   │  2. 获取 project_id               │
      │                                   │  3. 获取 backend_wallet           │
      │                                   │                                   │
      │                                   │  内部调用 thirdweb engine         │
      │                                   │ ─────────────────────────────────>│
      │                                   │                                   │
      │                                   │  返回 queue_id, tx_hash           │
      │                                   │ <─────────────────────────────────│
      │                                   │                                   │
      │                                   │  4. 存储到 project_transactions   │
      │                                   │                                   │
      │  返回:                             │                                   │
      │  { tx_id, status, tx_hash }       │                                   │
      │ <─────────────────────────────────│                                   │
      │                                   │                                   │
```

## 凭证体系

| 凭证类型 | 格式 | 用途 | 暴露位置 |
|---------|------|------|---------|
| Client ID | `one_pk_xxx...` | 标识项目，前端安全使用 | 前端代码可见 |
| Publishable Key | `one_pk_xxx...` | 同Client ID | 前端代码可见 |
| Secret Key | `one_sk_xxx...` | 后端API调用 | 仅服务器端 |
| Thirdweb Client ID | 内部 | ONE调用thirdweb | 完全隐藏 |

## One Wallet作为第一个Project

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                ONE Ecosystem                                 │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Team: ONE Official                              │   │
│   │                                                                      │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │  Project: One Wallet (client_id: one_pk_wallet_official)    │   │   │
│   │   │                                                              │   │   │
│   │   │  • 所有One Wallet用户存储在这里                               │   │   │
│   │   │  • 使用ONE Engine的所有服务                                   │   │   │
│   │   │  • 是ONE生态的第一个也是旗舰级应用                            │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Team: Partner Company A                         │   │
│   │                                                                      │   │
│   │   ┌────────────────────────┐    ┌────────────────────────┐          │   │
│   │   │  Project: GameFi App   │    │  Project: NFT Market   │          │   │
│   │   │  client_id: one_pk_xxx │    │  client_id: one_pk_yyy │          │   │
│   │   │  独立的用户和数据       │    │  独立的用户和数据       │          │   │
│   │   └────────────────────────┘    └────────────────────────┘          │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
one-engine/
├── src/
│   ├── app/api/v1/
│   │   ├── connect/          # Connect服务 (对外)
│   │   │   ├── auth/         # 用户认证
│   │   │   └── users/        # 用户列表
│   │   ├── wallet/           # 钱包服务 (对外)
│   │   ├── contracts/        # 合约服务 (对外)
│   │   ├── pay/              # 支付服务 (对外)
│   │   └── engine/           # 后端交易 (对外)
│   │
│   ├── services/
│   │   ├── thirdweb/         # Thirdweb封装 (内部)
│   │   │   ├── connect.ts    # 封装thirdweb connect
│   │   │   ├── engine.ts     # 封装thirdweb engine
│   │   │   └── pay.ts        # 封装thirdweb pay
│   │   └── ...
│   │
│   ├── middleware/
│   │   └── projectAuth.ts    # 项目认证中间件
│   │
│   └── database/migrations/
│       └── 010_multi_tenant_architecture.sql

one-dashboard/
├── src/app/dashboard/
│   └── team/[teamSlug]/
│       ├── page.tsx          # 团队概览
│       ├── projects/         # 项目列表
│       └── [projectId]/      # 项目详情
│           ├── connect/      # Connect管理
│           ├── contracts/    # 合约管理
│           ├── engine/       # Engine管理
│           └── settings/     # 项目设置
```
