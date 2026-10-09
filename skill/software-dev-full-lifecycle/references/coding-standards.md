# 编码规范与反模式

> 本文是 `software-dev-full-lifecycle` Skill 的配套规范参考，供 AI 在 P3 编码实现阶段执行时遵循。内容对齐 SKILL.md 第 3 章（P3 编码实现）与铁律 4（业务规则集中）、铁律 5（可追溯）。示例业务沿用 CRM 销售管理（报价审批）。

代码是流程的最终落点。规范的目标只有一个：**让接手的人能看懂"为什么这么做"，且业务规则改得动、找得到**。本文给出命名、类型、组件、错误处理、注释、目录约定，并配以正反例（TypeScript/React）。

---

## 1. 命名规范

| 对象 | 约定 | 正例 | 反例 |
| --- | --- | --- | --- |
| 变量/函数 | camelCase，表意不缩写 | `pendingQuotations` | `pqList`、`data1` |
| 组件 | PascalCase，名词或名词短语 | `QuotationApprovalModal` | `Modal1`、`quotation_approval` |
| 常量/枚举 | UPPER_SNAKE | `MAX_DISCOUNT_RATE` | `maxRate` |
| 类型/接口 | PascalCase，接口可加 `I` 或 `Type` | `Quotation`、`ApprovalRule` | `quotation`（类型小写） |
| 文件 | kebab-case 或 camelCase 与框架一致 | `quotation-service.ts` | `QS.ts` |
| 布尔 | is/has/can 前缀 | `isApproved` | `approvedFlag` |

命名即文档：读名字就知道用途，少写注释。

---

## 2. TypeScript 严格模式

- `tsconfig` 开启 `"strict": true`，含 `noImplicitAny`、`strictNullChecks`、`noUnusedLocals`。
- **禁止 `any` 泛滥**（铁律/反模式对应）。确需未知结构用 `unknown` 并做类型守卫：
```ts
// 反例
function parse(r: any) { return r.amount; }
// 正例
function parse(r: unknown): number {
  if (typeof r === 'object' && r && 'amount' in r) {
    return Number((r as { amount: unknown }).amount);
  }
  throw new Error('INVALID_PAYLOAD');
}
```
- 外部接口数据在边界处用 zod/yup 校验并推导类型，内部一律强类型。

---

## 3. 组件拆分与关注点分离

原则：组件只负责展示，业务动作集中在状态/服务层（SKILL.md 3.2.4）。

```
pages/          路由级页面（薄，只组装）
features/       业务特性（承接用例）
components/ui/   纯展示原子组件（无业务）
components/      业务组件（调用 service）
services/        API 调用与编排
domain/         实体类型、业务规则函数
config/         业务规则常量与阈值
store/          全局状态（仅跨页共享）
shared/         通用工具、常量、hooks
```

```tsx
// 反例：组件内直接写业务判断与阈值
function QuotationForm() {
  const submit = (q: Quotation) => {
    if (q.discountRate >= 0.3) { /* 两级审批 */ }  // 阈值硬编码！
  };
}

// 正例：阈值来自 config，规则来自 domain
import { APPROVAL_RULES } from '@/config/approval.config';
import { resolveApprovalChain } from '@/domain/approval';
function QuotationForm() {
  const submit = (q: Quotation) => {
    const chain = resolveApprovalChain(q, APPROVAL_RULES); // 业务在 domain
    approvalService.submit(q, chain);
  };
}
```

---

## 4. 业务规则集中（铁律 4，底线）

- 所有阈值、状态流转条件、审批层级写在 `config/` 或 `domain/`，**禁止散落魔法数字**。
- 单文件不超过 300 行，超出必拆（SKILL.md 3.2.2）。
- 规则可单测：`resolveApprovalChain` 输入折扣率/金额，输出审批链。

```ts
// config/approval.config.ts
export const APPROVAL_RULES = {
  TWO_LEVEL_DISCOUNT_THRESHOLD: 0.30, // 30%
  TWO_LEVEL_AMOUNT_THRESHOLD_CENTS: 5_000_000, // 50万（分）
} as const;
```

---

## 5. 错误处理

- 每个破坏性操作有二次确认；每个操作有成功/失败反馈（SKILL.md 3.2.5/3.2.7）。
- 写入失败**不得静默**，必须提示用户并保留可重试。
- 统一错误边界组件捕获渲染异常，不白屏。

```tsx
// 反例：吞掉错误
try { await save(q); } catch { /* 什么都不做 */ }

// 正例：明确反馈
try {
  await save(q);
  toast.success('报价已保存');
} catch (e) {
  toast.error(getUserMessage(e)); // 用户可读文案
  reportError(e);                 // 上报追踪号
}
```

---

## 6. 金额精度（铁律 4 衍生）

- 金额用**整数分**（`amountCents: number`），计算用整数，展示层除 100。
```ts
// 反例：裸 float
const total = price * qty; // 可能 0.1+0.2 失真
// 正例
const totalCents = priceCents * qty; // 整数
```
- 审计/历史类数据（审批记录、状态历史、操作日志）**禁止物理删除**，用软删或仅追加。

---

## 7. 注释规范

- 不写废话注释（`// 设置名称` 配 `setName()`）。
- 写"为什么"而非"做什么"：业务规则、非常规取舍、算法来源。
- 复杂规则引用需求/ADR 编号，保证可追溯：
```ts
// BR-QUOTE-APPROVAL：折扣率≥30% 或金额≥50万触发两级审批
function resolveApprovalChain(...) { ... }
```
- 公开 API/组件写 JSDoc（参数、返回、异常）。

---

## 8. 目录与提交约定

- 目录按上文分层，禁止页面里塞 SQL、组件里写阈值。
- Git：一次提交=一个逻辑变更，Conventional Commits：
  `feat(quotation): 折扣率≥30%触发两级审批链`
  `fix(approval): 驳回后状态未回退草稿`
- 打 tag：`v0.1.0 / v0.5.0 / v0.9.0 / v1.0.0`；禁止 force push 受保护分支、禁止提交密钥（SKILL.md 3.3）。

---

## 9. 反模式对照（本文直接对抗 SKILL.md 反模式清单）

| SKILL.md 反模式 | 本文对应禁止 |
| --- | --- |
| 3 阈值硬编码多处 | §4 业务规则集中 |
| 4 只正向流程忽略异常 | §5/§7 异常与边界处理 |
| 文档与代码两套说法 | §7 注释引用需求编号 |
| 8 提交信息 "update" | §8 Conventional Commits |
| 魔法数字/any 泛滥 | §2/§4 严格模式与 config |

---

## 10. 与本项目一致的关键约定（落地清单）
1. 禁止 `any`：边界 `unknown` + 守卫，内部强类型。
2. 业务规则集中在 `config/`：阈值、状态流转、审批层级，单测覆盖。
3. 金额用整数分：`*Cents` 命名，整数计算。
4. 审计不可删：审批记录/日志/状态历史软删或追加。
5. 单文件 ≤ 300 行；组件只展示，业务在 service/domain。
6. 每破坏性操作二次确认；每操作三态反馈；失败不静默。

对应文档：17-编码规范、18-Git协作与分支管理规范、19-环境搭建与运行手册、20-模块实现说明。P3 Gate：类型零错、可一键启动、覆盖全部 Must、阈值全在配置。
