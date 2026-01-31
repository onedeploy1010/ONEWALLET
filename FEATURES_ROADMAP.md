# ONE Ecosystem 功能路线图

## 当前功能完整性总览

| 模块 | 完整度 | 状态 |
|-----|-------|------|
| ONE Engine | 82% | ⚠️ 需补充 |
| ONE Dashboard | 85% | ⚠️ 需补充 |
| SDK | 95% | ✅ 基本完整 |
| Wallet Mobile | 95% | ✅ 基本完整 |
| Wallet Web | 50% | ❌ 需要大量开发 |

---

## 一、ONE Engine 补充功能

### P1 - 立即补充（关键功能）

#### 1. Swap 执行端点 🔴
```
缺失：
  POST /api/v1/swap/execute - 执行交换
  GET  /api/v1/swap/{swapId} - 获取交换状态
  GET  /api/v1/swap/history - 交换历史

文件位置：/one-engine/src/app/api/v1/swap/
```

#### 2. 钱包单项操作 🔴
```
缺失：
  GET    /api/v1/wallet/{id}
  PUT    /api/v1/wallet/{id}
  DELETE /api/v1/wallet/{id}
  GET    /api/v1/wallet/{id}/balance
  GET    /api/v1/wallet/{id}/transactions

文件位置：/one-engine/src/app/api/v1/wallet/[id]/
```

#### 3. 合约管理端点 🔴
```
缺失：
  GET    /api/v1/contracts/{id}
  PUT    /api/v1/contracts/{id}
  DELETE /api/v1/contracts/{id}
  POST   /api/v1/contracts/{id}/write
  POST   /api/v1/contracts/{id}/verify

文件位置：/one-engine/src/app/api/v1/contracts/[id]/
```

#### 4. 法币 Offramp 🔴
```
缺失：
  POST /api/v1/fiat/offramp - 创建卖币会话
  GET  /api/v1/fiat/offramp/{id} - 获取状态

文件位置：/one-engine/src/app/api/v1/fiat/offramp/
```

### P2 - 本周补充

#### 1. 密钥管理升级 🟠
```
当前：Base64 编码（不安全）
目标：集成 AWS KMS / Azure Key Vault

文件：/one-engine/src/services/wallet/wallet.service.ts
```

#### 2. 交易监听 🟠
```
缺失：
  WebSocket 实时交易状态
  POST /api/v1/transactions
  GET  /api/v1/transactions/{txHash}

文件位置：/one-engine/src/app/api/v1/transactions/
```

#### 3. KYC/AML 端点 🟠
```
缺失：
  GET  /api/v1/users/{id}/kyc
  POST /api/v1/users/{id}/kyc
  GET  /api/v1/users/{id}/aml-status

文件位置：/one-engine/src/app/api/v1/users/[id]/kyc/
```

### P3 - 本月补充

- Redis 缓存集成优化
- 费率管理系统
- 高级策略参数
- 审计日志完善

---

## 二、Wallet Web 补充功能（重点）

### P1 - 立即补充（关键缺失）

#### 1. 认证模块 🔴 CRITICAL
```
需创建：
  /auth/login          - 登录页面
  /auth/signup         - 注册页面
  /auth/forgot-password - 忘记密码
  /auth/kyc            - KYC验证
  /auth/otp-verify     - OTP验证

文件位置：/wallet/one-wallet-web/src/app/auth/
```

#### 2. 支付模块 🔴 CRITICAL
```
需创建：
  /payments           - 支付首页
  /payments/scan      - QR扫描
  /payments/request   - 请求支付
  /payments/history   - 支付历史
  /payments/bills     - 账单支付
  /payments/merchant  - 商户中心

文件位置：/wallet/one-wallet-web/src/app/payments/
```

#### 3. ONE Engine SDK 集成 🔴
```
当前：仅 Thirdweb 集成
目标：完整 ONE Engine SDK 集成

文件：/wallet/one-wallet-web/src/services/
需要：添加 OneEngineClient
```

### P2 - 扩展功能

#### 1. AI 交易页面扩展 🟠
```
需创建：
  /trading/[strategyId] - 策略详情
  /trading/positions    - 我的头寸
  /trading/orders       - 订单管理
  /trading/builder      - 策略构建器
  /trading/chat         - AI聊天

文件位置：/wallet/one-wallet-web/src/app/trading/
```

#### 2. 用户中心 🟠
```
需创建：
  /profile              - 个人资料
  /account-management   - 账户管理
  /security-settings    - 安全设置
  /notifications        - 通知中心

文件位置：/wallet/one-wallet-web/src/app/
```

#### 3. 交换中心 🟠
```
需创建：
  /exchange            - 交换中心
  /exchange/bridge     - 跨链桥接

文件位置：/wallet/one-wallet-web/src/app/exchange/
```

### P3 - 设置扩展

- 支付优先级设置
- 安全设置详情
- 通知偏好设置
- 语言和货币设置

---

## 三、Dashboard 补充功能

### P1 - 高优先级

#### 1. Connect Pay 完善 🟠
```
位置：/dashboard/team/[teamSlug]/[projectId]/connect/pay
状态：页面框架存在，需要实现功能
```

#### 2. Analytics 完善 🟠
```
位置：/dashboard/team/[teamSlug]/[projectId]/connect/analytics
状态：页面框架存在，需要数据源
```

### P2 - 中等优先级

- Engine Webhooks 完整管理
- 团队成员邀请系统
- 高级分析和报表导出
- 计费和配额管理

---

## 四、实施计划

### 第一阶段（1-2周）
- [ ] Engine: 补充 Swap execute、Wallet CRUD、Contract CRUD
- [ ] Wallet Web: 创建认证模块（登录/注册/KYC）
- [ ] Wallet Web: 创建支付模块基础页面

### 第二阶段（3-4周）
- [ ] Engine: 补充法币 Offramp
- [ ] Engine: 密钥管理升级
- [ ] Wallet Web: Engine SDK 集成
- [ ] Wallet Web: AI 交易页面扩展

### 第三阶段（5-6周）
- [ ] Engine: 交易监听和 WebSocket
- [ ] Engine: KYC/AML 端点
- [ ] Wallet Web: 用户中心完善
- [ ] Dashboard: Analytics 和 Pay 完善

### 第四阶段（7-8周）
- [ ] 完整测试覆盖
- [ ] 性能优化
- [ ] 安全审计
- [ ] 文档完善

---

## 五、技术债务清单

1. **私钥存储** - 从 Base64 升级到 KMS
2. **测试覆盖** - 单元测试和集成测试
3. **API 文档** - OpenAPI/Swagger 集成
4. **错误监控** - Sentry 集成
5. **性能监控** - APM 工具集成
6. **日志管理** - 集中式日志收集

---

## 六、功能对照表

| 功能 | Engine | Mobile | Web | Dashboard |
|-----|--------|--------|-----|-----------|
| 钱包创建 | ✅ | ✅ | ✅ | - |
| 转账发送 | ✅ | ✅ | ✅ | - |
| Token 交换 | ⚠️ | ✅ | ✅ | - |
| 法币购买 | ✅ | ✅ | ✅ | - |
| 法币卖出 | ❌ | ✅ | ❌ | - |
| QR 支付 | ✅ | ✅ | ❌ | - |
| AI 交易 | ✅ | ✅ | ⚠️ | - |
| 卡片管理 | ✅ | ✅ | ⚠️ | - |
| 用户认证 | ✅ | ✅ | ❌ | ✅ |
| KYC | ✅ | ✅ | ❌ | ✅ |
| 项目管理 | ✅ | - | - | ✅ |
| API Key | ✅ | - | - | ✅ |

**图例**: ✅ 完整 | ⚠️ 部分 | ❌ 缺失 | - 不适用

---

## 七、资源估算

| 任务 | 工作量 | 优先级 |
|-----|-------|-------|
| Wallet Web 认证模块 | 3-5人天 | P1 |
| Wallet Web 支付模块 | 5-7人天 | P1 |
| Engine Swap 完善 | 2-3人天 | P1 |
| Engine 钱包 CRUD | 2-3人天 | P1 |
| Engine 合约 CRUD | 2-3人天 | P1 |
| Engine Offramp | 3-4人天 | P1 |
| 密钥管理升级 | 3-5人天 | P2 |
| AI 交易扩展 | 5-7人天 | P2 |

**总计估算**: 25-40 人天完成核心功能补充
