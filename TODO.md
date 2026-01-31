# ONE Ecosystem 功能补充 TODO

## 📊 当前状态总览

| 模块 | 完整度 | 需要修复 | 优先级 |
|------|--------|---------|-------|
| Dashboard | 95% ✅ | 无需修复 | - |
| Engine | 82% ⚠️ | 14个API端点 | 高 |
| Wallet Web | 52% ❌ | 认证/支付/KYC | 高 |

---

## 一、ONE Engine API 端点补充

### Phase 1: Swap模块 (预计: 2小时)

- [ ] **1.1** 创建 Swap Execute 端点
  ```
  文件: one-engine/src/app/api/v1/swap/execute/route.ts
  方法: POST
  功能: 执行交换交易
  依赖: swapService.executeSwap() (已实现)
  ```

### Phase 2: Wallet模块 (预计: 3小时)

- [ ] **2.1** 创建单钱包操作端点
  ```
  文件: one-engine/src/app/api/v1/wallet/[id]/route.ts
  方法: GET/PUT/DELETE
  功能:
    - GET: 获取单个钱包详情
    - PUT: 更新钱包信息(别名、标签)
    - DELETE: 删除钱包
  ```

### Phase 3: Contracts模块 (预计: 4小时)

- [ ] **3.1** 创建单合约操作端点
  ```
  文件: one-engine/src/app/api/v1/contracts/[id]/route.ts
  方法: GET/PUT/DELETE
  功能:
    - GET: 获取合约详情
    - PUT: 更新合约元数据
    - DELETE: 删除合约
  ```

- [ ] **3.2** 创建合约Write端点
  ```
  文件: one-engine/src/app/api/v1/contracts/[id]/write/route.ts
  方法: POST
  功能: 执行合约状态修改方法
  ```

### Phase 4: Fiat模块 (预计: 3小时)

- [ ] **4.1** 创建Offramp端点
  ```
  文件: one-engine/src/app/api/v1/fiat/offramp/route.ts
  方法: GET/POST
  功能:
    - GET: 获取支持的出金配置
    - POST: 创建出金会话
  ```

### Phase 5: Assets模块 (预计: 2小时)

- [ ] **5.1** 创建NFT资产端点
  ```
  文件: one-engine/src/app/api/v1/assets/nft/route.ts
  方法: GET
  功能: 获取钱包NFT资产列表
  ```

### Phase 6: Transactions模块 (预计: 5小时)

- [ ] **6.1** 创建交易列表端点
  ```
  文件: one-engine/src/app/api/v1/transactions/route.ts
  方法: GET/POST
  功能: 获取/创建交易记录
  ```

- [ ] **6.2** 创建交易详情端点
  ```
  文件: one-engine/src/app/api/v1/transactions/[hash]/route.ts
  方法: GET
  功能: 获取特定交易详情
  ```

- [ ] **6.3** 创建TransactionService
  ```
  文件: one-engine/src/services/transaction/transaction.service.ts
  功能: 交易查询、状态跟踪、历史记录
  ```

---

## 二、Wallet Web 功能补充

### Phase 1: 认证系统 (预计: 2天)

#### 1.1 创建认证页面
- [ ] **1.1.1** 创建登录页面
  ```
  文件: wallet/one-wallet-web/src/app/auth/login/page.tsx
  参考: wallet/one-wallet/src/screens/auth/EmailLoginScreen.tsx
  功能: 邮箱输入、发送OTP、Demo模式
  ```

- [ ] **1.1.2** 创建注册页面
  ```
  文件: wallet/one-wallet-web/src/app/auth/signup/page.tsx
  参考: wallet/one-wallet/src/screens/auth/SignUpScreen.tsx
  功能: 邮箱注册、钱包创建
  ```

- [ ] **1.1.3** 创建OTP验证页面
  ```
  文件: wallet/one-wallet-web/src/app/auth/verify/page.tsx
  参考: wallet/one-wallet/src/screens/auth/OTPVerificationScreen.tsx
  功能: OTP输入、倒计时、重新发送
  ```

- [ ] **1.1.4** 创建认证布局
  ```
  文件: wallet/one-wallet-web/src/app/auth/layout.tsx
  功能: 认证页面的统一布局
  ```

#### 1.2 创建认证组件
- [ ] **1.2.1** LoginForm组件
  ```
  文件: wallet/one-wallet-web/src/components/auth/LoginForm.tsx
  ```

- [ ] **1.2.2** SignupForm组件
  ```
  文件: wallet/one-wallet-web/src/components/auth/SignupForm.tsx
  ```

- [ ] **1.2.3** OTPInput组件
  ```
  文件: wallet/one-wallet-web/src/components/auth/OTPInput.tsx
  ```

#### 1.3 更新认证服务
- [ ] **1.3.1** 增强AuthService
  ```
  文件: wallet/one-wallet-web/src/services/auth/AuthService.ts
  新增方法:
    - sendOTP(email: string)
    - verifyOTP(email: string, otp: string)
    - createAccount(email: string)
    - logout()
  集成: OneWalletService的认证方法
  ```

### Phase 2: KYC系统 (预计: 1.5天)

- [ ] **2.1** 创建KYC页面
  ```
  文件: wallet/one-wallet-web/src/app/kyc/page.tsx
  参考: wallet/one-wallet/src/screens/auth/KYCFormScreen.tsx
  功能: 3步KYC流程、文档上传
  ```

- [ ] **2.2** 创建KYC组件
  ```
  文件: wallet/one-wallet-web/src/components/kyc/KYCForm.tsx
  文件: wallet/one-wallet-web/src/components/kyc/DocumentUpload.tsx
  文件: wallet/one-wallet-web/src/components/kyc/KYCProgress.tsx
  ```

- [ ] **2.3** 创建KYCStore
  ```
  文件: wallet/one-wallet-web/src/store/kycStore.ts
  状态: documents, status, currentStep, error
  ```

### Phase 3: 支付系统 (预计: 2.5天)

#### 3.1 创建支付页面
- [ ] **3.1.1** 支付主页
  ```
  文件: wallet/one-wallet-web/src/app/pay/page.tsx
  参考: wallet/one-wallet/src/screens/pay/PayHomeScreen.tsx
  功能: 快速操作、最近交易、扫码入口
  ```

- [ ] **3.1.2** 账单支付页面
  ```
  文件: wallet/one-wallet-web/src/app/pay/bills/page.tsx
  参考: wallet/one-wallet/src/screens/pay/PayBillsScreen.tsx
  功能: 账单提供商、支付表单
  ```

- [ ] **3.1.3** 支付请求页面
  ```
  文件: wallet/one-wallet-web/src/app/pay/request/page.tsx
  参考: wallet/one-wallet/src/screens/pay/RequestPaymentScreen.tsx
  功能: 生成支付请求、QR码
  ```

- [ ] **3.1.4** 支付布局
  ```
  文件: wallet/one-wallet-web/src/app/pay/layout.tsx
  ```

#### 3.2 创建支付组件
- [ ] **3.2.1** PaymentMethodSelector
  ```
  文件: wallet/one-wallet-web/src/components/pay/PaymentMethodSelector.tsx
  ```

- [ ] **3.2.2** BillProviderList
  ```
  文件: wallet/one-wallet-web/src/components/pay/BillProviderList.tsx
  ```

- [ ] **3.2.3** PaymentForm
  ```
  文件: wallet/one-wallet-web/src/components/pay/PaymentForm.tsx
  ```

- [ ] **3.2.4** PaymentHistory
  ```
  文件: wallet/one-wallet-web/src/components/pay/PaymentHistory.tsx
  ```

- [ ] **3.2.5** QRCodeDisplay
  ```
  文件: wallet/one-wallet-web/src/components/pay/QRCodeDisplay.tsx
  ```

#### 3.3 创建支付服务和Store
- [ ] **3.3.1** PaymentService
  ```
  文件: wallet/one-wallet-web/src/services/payment/PaymentService.ts
  方法:
    - getBillProviders()
    - payBill(provider, account, amount)
    - createPaymentRequest(amount, currency)
    - getPaymentHistory()
  集成: OneWalletService的支付方法
  ```

- [ ] **3.3.2** PaymentStore
  ```
  文件: wallet/one-wallet-web/src/store/paymentStore.ts
  状态: providers, history, currentPayment
  ```

### Phase 4: 增强交易功能 (预计: 1.5天)

- [ ] **4.1** 创建AI聊天页面
  ```
  文件: wallet/one-wallet-web/src/app/trading/chat/page.tsx
  参考: wallet/one-wallet/src/screens/ai/AIChatScreen.tsx
  ```

- [ ] **4.2** 创建策略构建器页面
  ```
  文件: wallet/one-wallet-web/src/app/trading/builder/page.tsx
  参考: wallet/one-wallet/src/screens/ai/StrategyBuilderScreen.tsx
  ```

- [ ] **4.3** 创建AI聊天组件
  ```
  文件: wallet/one-wallet-web/src/components/trading/AIChatInterface.tsx
  文件: wallet/one-wallet-web/src/components/trading/MessageBubble.tsx
  ```

### Phase 5: 补充其他功能 (预计: 1天)

- [ ] **5.1** 创建推荐页面
  ```
  文件: wallet/one-wallet-web/src/app/referral/page.tsx
  参考: wallet/one-wallet/src/screens/more/ReferralScreen.tsx
  ```

- [ ] **5.2** 创建交易详情页面
  ```
  文件: wallet/one-wallet-web/src/app/transactions/[id]/page.tsx
  参考: wallet/one-wallet/src/screens/wallet/TransactionDetailScreen.tsx
  ```

- [ ] **5.3** 更新侧边栏导航
  ```
  文件: wallet/one-wallet-web/src/components/layout/Sidebar.tsx
  新增: Pay、KYC、Referral 导航项
  ```

### Phase 6: 替换Mock数据为真实API (预计: 1天)

- [ ] **6.1** 更新Dashboard组件
  ```
  文件: wallet/one-wallet-web/src/components/dashboard/Dashboard.tsx
  改动: 使用OneWalletService获取真实数据
  ```

- [ ] **6.2** 更新Trading页面
  ```
  文件: wallet/one-wallet-web/src/app/trading/page.tsx
  改动: 使用AITradingService获取真实策略数据
  ```

- [ ] **6.3** 更新Assets页面
  ```
  文件: wallet/one-wallet-web/src/app/assets/page.tsx
  改动: 使用OneWalletService获取真实资产数据
  ```

- [ ] **6.4** 更新Cards页面
  ```
  文件: wallet/one-wallet-web/src/app/cards/page.tsx
  改动: 使用真实卡片API
  ```

---

## 三、Dashboard 优化 (可选)

Dashboard已95%完成，以下为可选优化:

- [ ] **可选1** 添加实时数据更新(WebSocket)
- [ ] **可选2** 增强错误消息本地化
- [ ] **可选3** 添加更多输入验证
- [ ] **可选4** 性能监测指标

---

## 四、执行顺序

### 第1周
1. ✅ Engine Phase 1-2 (Swap + Wallet端点)
2. ✅ Wallet Web Phase 1 (认证系统)

### 第2周
3. ✅ Engine Phase 3-4 (Contracts + Fiat端点)
4. ✅ Wallet Web Phase 2 (KYC系统)

### 第3周
5. ✅ Engine Phase 5-6 (Assets + Transactions)
6. ✅ Wallet Web Phase 3 (支付系统)

### 第4周
7. ✅ Wallet Web Phase 4-5 (交易增强 + 其他功能)
8. ✅ Wallet Web Phase 6 (Mock数据替换)

---

## 五、文件清单总计

### Engine新增文件: 10个
```
one-engine/src/app/api/v1/
├── swap/execute/route.ts
├── wallet/[id]/route.ts
├── contracts/[id]/route.ts
├── contracts/[id]/write/route.ts
├── fiat/offramp/route.ts
├── assets/nft/route.ts
├── transactions/route.ts
└── transactions/[hash]/route.ts

one-engine/src/services/
└── transaction/transaction.service.ts
```

### Wallet Web新增文件: 约35个
```
wallet/one-wallet-web/src/
├── app/
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify/page.tsx
│   ├── kyc/page.tsx
│   ├── pay/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── bills/page.tsx
│   │   └── request/page.tsx
│   ├── trading/
│   │   ├── chat/page.tsx
│   │   └── builder/page.tsx
│   ├── referral/page.tsx
│   └── transactions/[id]/page.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── OTPInput.tsx
│   ├── kyc/
│   │   ├── KYCForm.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── KYCProgress.tsx
│   ├── pay/
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── BillProviderList.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentHistory.tsx
│   │   └── QRCodeDisplay.tsx
│   └── trading/
│       ├── AIChatInterface.tsx
│       └── MessageBubble.tsx
├── services/
│   └── payment/PaymentService.ts
└── store/
    ├── kycStore.ts
    └── paymentStore.ts
```

---

## 六、进度追踪

使用以下格式追踪进度:
- [ ] 未开始
- [x] 已完成
- [~] 进行中

当前进度: **0%**

---

## 七、依赖关系

```
认证系统 ──► KYC系统 ──► 支付系统
    │                      │
    └──────► 交易功能 ◄────┘
                │
                └──► Mock数据替换
```

---

## 八、测试清单

每个Phase完成后需要测试:

### Engine测试
- [ ] Swap execute API正常工作
- [ ] 单钱包CRUD正常工作
- [ ] 合约CRUD和Write正常工作
- [ ] Offramp API正常工作
- [ ] NFT资产API正常工作
- [ ] 交易API正常工作

### Wallet Web测试
- [ ] 用户可以登录/注册
- [ ] OTP验证流程正常
- [ ] KYC文档可以上传
- [ ] 账单支付功能正常
- [ ] 支付请求可以生成
- [ ] AI聊天可以使用
- [ ] 策略构建器可以使用
- [ ] 所有页面显示真实数据

---

*最后更新: 2026-01-12*
