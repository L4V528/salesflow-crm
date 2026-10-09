# 模块实现说明

| 项 | 内容 |
|---|---|
| 文档编号 | SFS-CRM-MI-01 |
| 项目名称 | SalesFlow 智销云 · 销售全流程管理平台（SalesFlow CRM） |
| 版本 | v1.0 |
| 编写日期 | 2026-10-09 |
| 状态 | 已评审通过 |

**版本变更历史**

| 版本 | 日期 | 修订人 | 修订说明 |
|---|---|---|---|
| v0.1 | 2026-10-07 | 开发组 | 实现概况与页面职责初稿 |
| v1.0 | 2026-10-09 | 开发组 | 补充技术难点、实现技巧与代码质量措施 |

---

## 1. 代码实现概况

### 1.1 规模统计

统计命令（在项目根目录 `app/` 下执行）：

```bash
find app/src -name "*.tsx" -o -name "*.ts" | xargs wc -l
```

实际统计结果（数据来源：上述命令真实执行输出）：

| 目录 | 文件数 | 代码行数 | 占比 |
|---|---|---|---|
| `pages/` | 10 | 3,058 | 51.6% |
| `store/` | 2 | 946 | 16.0% |
| `components/` | 3 | 615 | 10.4% |
| `data/` | 1 | 588 | 9.9% |
| `types.ts` | 1 | 313 | 5.3% |
| `config/` | 1 | 148 | 2.5% |
| `lib/` | 3 | 169 | 2.9% |
| `App.tsx` + `main.tsx` | 2 | 92 | 1.6% |
| **合计** | **23** | **5,929** | **100%** |

单文件行数明细（前 8 位）：

| 文件 | 行数 | 说明 |
|---|---|---|
| `store/AppContext.tsx` | 762 | 全局状态与 24 个业务动作，业务逻辑核心 |
| `data/seed.ts` | 588 | 演示数据构造 |
| `pages/Opportunities.tsx` | 451 | 商机看板 |
| `pages/Leads.tsx` | 423 | 线索管理 |
| `pages/Quotations.tsx` | 409 | 报价与审批 |
| `pages/Customers.tsx` | 382 | 客户管理 |
| `pages/Orders.tsx` | 353 | 合同订单 |
| `types.ts` | 313 | 领域模型 |

非 TS/TSX 配套文件：`index.html`、`src/index.css`、`tailwind.config.js`、`postcss.config.js`、`vite.config.ts`、`tsconfig.json`、`package.json`。

### 1.2 与 NFR-M-04 的偏差说明

NFR-M-04 要求单个源文件不超过 300 行。当前有 8 个文件超限（`AppContext.tsx`、`seed.ts` 及 6 个页面）。成因与处置：

| 成因 | 处置 |
|---|---|
| 业务动作语义上应集中（NFR-M-02），拆分会破坏"一处看全" | 保留集中，但在文件内以 `/* ===== 模块名 ===== */` 注释分区，便于定位 |
| 页面含私有子组件（抽屉/弹窗/表单），同页面内聚性优先 | 子组件与页面同文件但独立函数，未来可整体迁出 |
| 演示数据构造天然冗长 | 已按实体分段构造，函数化封装 |

已在《详细设计说明书》第 6 章登记为 D-01 待重构项。

---

## 2. 目录结构

```
app
├── index.html
├── package.json / tsconfig.json / vite.config.ts
├── tailwind.config.js / postcss.config.js
└── src
    ├── main.tsx            入口：StrictMode + BrowserRouter + AppProvider
    ├── App.tsx             路由与权限守卫
    ├── index.css           Tailwind 入口与全局样式
    ├── types.ts            领域模型
    ├── config/             业务规则常量
    ├── lib/                工具：storage / id / format
    ├── data/               演示数据
    ├── store/              AppContext（动作层） + selectors（派生层）
    ├── components/         Layout / ui / charts
    └── pages/              10 个页面
```

**模块依赖矩阵**（行依赖列）：

| 模块 | types | config | lib | data | store | components | pages |
|---|---|---|---|---|---|---|---|
| pages | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| components | ✓ | ✓ | ✓ | — | ✓ | — | — |
| store | ✓ | ✓ | ✓ | ✓ | — | — | — |
| data | ✓ | — | ✓ | — | — | — | — |
| lib | ✓ | — | — | — | — | — | — |
| config | ✓ | — | — | — | — | — | — |

依赖严格单向向下，无环、无反向引用。

---

## 3. 页面实现职责

### 3.1 Login（129 行）

左侧品牌区展示产品价值主张（线索管理/商机看板/报价审批/回款管理四段说明），右侧为账号密码表单与演示账号列表。实现要点：`useState` 管理 `username/password/error`；表单校验缺失时内联提示"请输入账号/请输入密码"；回车键提交（`onKeyDown` Enter → `submit`）；演示账号列表来自 `DEMO_ACCOUNTS`，点击即填充并调用 `login(u, '123456')`，成功后 Toast + 跳转 `/dashboard`；密码使用 `type="password"` 掩码（NFR-S-03）。

### 3.2 Dashboard（179 行）

工作台聚合页。四个 `StatCard` 分别为待跟进线索、进行中商机、待我审批、本月待回款；财务角色隐藏线索与商机卡片（`isFinance` 判断）。下方两栏：左侧"今日待跟进"表格（过滤 `nextFollowAt <= today && status === 'FOLLOWING'`，逾期日期标红）与"待我审批的报价单"；右侧"我的商机漏斗"（`FunnelChart`）与"回款进度概览"（`Progress`）。底部"最近动态"取 `db.activityLogs.slice(0, 8)`。所有集合先经 `visible*` 过滤再用 `useMemo` 缓存。逾期时顶部插入红色预警条并可一键跳转回款页。

### 3.3 Leads（423 行）

线索页由"四张状态概览卡 + 筛选栏 + 列表 + 右侧来源分布/转化概览"构成，私有子组件三个：`CreateLeadModal`、`FollowUpDrawer`、`ConvertModal`。要点：关键词/状态/来源/归属四维组合筛选；`isManager`（MANAGER 或 ADMIN）才渲染复选框与批量分配条，且仅 `status === 'NEW'` 的线索可选；新建线索本地校验公司名称、联系人、电话正则 `/^\d{7,15}$/`；跟进抽屉内填写方式/内容/结果/下次跟进，内容为空时按钮禁用；转化弹窗勾选"同时创建商机"才展开标题与金额输入；废弃走独立 Modal 且原因必选。列表手机号使用 `maskPhone` 脱敏。

### 3.4 Customers（382 行）

客户列表 + 客户 360 抽屉。列表展示编号/行业/等级（人工覆盖标注"（人工）"）/归属/累计成交/进行中商机数/订单数/建档时间。抽屉为标签页结构：基础信息（可编辑、可转移归属，勾选"同步转移进行中商机"）、联系人（新增表单与列表，主联系人单选）、关联商机、历史订单、回款记录、操作日志。实现上 `contactsOf/ordersOf/oppsOf/paymentsOf` 均以客户 ID 现场过滤，转移与更新分别调用 `transferCustomer` / `updateCustomer`。

### 3.5 Opportunities（451 行）

商机看板页。顶部五张阶段汇总卡（数量/金额/加权金额）；筛选栏含关键词、负责人与"看板视图/已关闭"Tab 切换；看板为五列栅格，卡片 `draggable`，列容器监听 `onDragOver/onDragLeave/onDrop`。拖拽实现见 4.1。详情抽屉展示金额/阶段/加权三卡、基本信息、阶段推进按钮组（点击即调用 `moveStage`，失败 Toast 展示前置条件）、下一阶段前置条件提示、关联报价单、阶段变更历史时间线。新建商机 Modal 在切换客户时检测同客户进行中商机并给出 BR-09 撞单警告（不阻断）。赢单/输单由 `CloseModal` 收集原因/竞品/实际成交金额。

### 3.6 Quotations（409 行）

报价与审批页。列表含报价总额、折后金额、折扣率、审批链徽标组、状态（过期覆盖显示"已过期"）、有效期。三个 Tab：全部 / 待我审批 / 我创建的。按钮按状态与身份条件渲染：草稿或已驳回且本人创建 → 提交；审批中且当前层级审批人为本人 → 通过/驳回。详情抽屉用 `Stepper` 渲染"创建 → 各级审批 → 生成订单"的时间线，并展示产品明细表与合计行。`CreateQuotationModal` 支持动态增删明细行，实时计算总额/折后/折扣率，并根据阈值提示审批级别（"需两级审批（销售经理 → 销售总监）"等）。

### 3.7 Orders（353 行）

订单页。顶部五张状态统计卡；列表展示合同金额、已回款、回款进度条、付款方式、状态。支持由 URL 参数 `?from=Qxxxx` 直接打开生成订单弹窗（报价详情页"生成合同订单"跳转）。FINANCE 角色在 `PENDING` 订单上可见"审核/驳回"，审核弹窗内预展示将要生成的各期回款计划。详情抽屉展示合同/已回款/待回款/付款方式四卡、基础信息、回款计划表、回款记录表；状态推进按 `NEXT_STATUS` 映射（SIGNED→"开始交付"、EXECUTING→"交付完成"），财务角色点击时提示由销售推进。

### 3.8 Payments（256 行）

回款页。四张统计卡（计划总额/已回款/待回款/逾期期次，逾期卡可点击筛选）。两个 Tab：回款计划与回款记录。计划表逾期行整行淡红底、日期标红并附注"已逾期"，剩余为 0 时显示"已完成"。登记回款 Modal 顶部展示计划金额/已回款/剩余，输入金额超出剩余即由 `registerPayment` 拒绝。财务角色在记录表可见"确认到账"与"开票"；非财务角色展示文案提示"需商务财务确认到账后才计入统计口径（BR-07）"。

### 3.9 Analytics（197 行）

数据看板。筛选栏支持时间范围（全部/本年度/本季度，按 `expectedCloseDate` 过滤）与部门（按 `ownerId` 所属部门过滤）。五个 KPI 卡：商机总金额、加权预测金额、赢单率、平均客单价、线索转化率。图表区 2×2 栅格：漏斗（含相邻阶段转化率与"良好/一般/偏低"评级）、业绩排行（虚线为目标线）、近 12 月回款趋势折线、线索来源环形图 + 转化率明细表。底部为赢单/输单明细双栏。所有图表数据来自 `selectors` 的 `buildFunnel / buildRanking / buildMonthlyPayments / buildSourceDistribution`。

### 3.10 Admin（279 行）

系统管理页，仅 ADMIN 可见（页面内再做一次角色兜底校验）。四个 Tab：用户管理（列表 + 新增/编辑 Modal，字段含姓名、账号、角色、岗位、部门、手机号、状态）、产品目录（列表 + 编辑，说明"报价单引用产品时会保存价格快照，此处调价不影响历史报价单"）、数据字典（线索来源、行业、阶段与赢率、枚举项以 Badge 展示）、数据概览（各实体条数与存储占用概览）。页头两个动作：`exportData` 导出 JSON、`resetDemo` 重置（`window.confirm` 二次确认，满足 NFR-U-02）。

---

## 4. 关键组件实现

### 4.1 UI 组件库（`components/ui/index.tsx`，296 行）

| 组件 | 用途 | 实现要点 |
|---|---|---|
| `cn` | 类名拼接 | `cls.filter(Boolean).join(' ')`，替代 clsx 依赖 |
| `Card` | 内容容器 | 支持 `title/extra/dense/bodyClassName`，`dense` 去除内边距以承载表格 |
| `Button` | 按钮 | 5 种 variant（primary/default/ghost/danger/success）× 2 种 size，禁用态统一 `disabled:opacity-50` |
| `Badge` | 状态徽标 | 6 种 tone 映射配色，`ring-1 ring-inset` 描边 |
| `Field` | 表单字段 | 统一 label/必填星号/hint/error 布局，错误优先于 hint 显示 |
| `Input/Textarea/Select` | 表单控件 | 共享 `inputCls`，统一聚焦环 `focus:ring-2 focus:ring-brand-100` |
| `Modal` | 居中弹窗 | 遮罩点击关闭，内容区 `max-h-[70vh] overflow-y-auto`，宽度可配 |
| `Drawer` | 右侧抽屉 | 全高右侧滑出，header/body/footer 三段，`w-[560px]`~`w-[680px]` |
| `Table/Th/Td` | 表格 | `min-w-[720px]` + 外层横向滚动兜底小屏 |
| `EmptyState` | 空状态 | 图标 + 主文案 + 提示，避免留白（NFR-U-04） |
| `StatCard` | 统计卡 | 支持 tone 与点击跳转 |
| `Tabs` | 标签页 | 受控 `active + onChange`，下划线激活态 |
| `Progress` | 进度条 | 输入 0~1，钳位后转百分比，可选显示文本 |
| `Stepper` | 审批时间线 | 四态圆点（done/current/todo/reject）+ 描述与元信息 |
| `ToastHost` | 全局提示 | 右上角堆叠，点击进入关闭 |

### 4.2 SVG 图表组件（`components/charts/index.tsx`，198 行）

| 组件 | 类型 | 实现要点 |
|---|---|---|
| `FunnelChart` | 横向漏斗条 | 宽度按金额占最大值比例，最小宽度 56px 保证可读 |
| `LineChart` | 折线 + 面积 | 手工计算 `viewBox` 坐标，`x(i)` 线性映射、`y(v)` 反向映射；`defs` 渐变填充；4 条网格线与 `moneyShort` 刻度；数据点 `<title>` 悬浮提示 |
| `BarRanking` | 横向条形排行 | 实线为达成、虚线为目标，条内显示达成率 |
| `PieChart` | 环形图 | 累加角度计算扇形路径，`large-arc-flag` 处理 >50% 场景，单一切片时特殊路径闭合；中心显示总数 |
| `MiniBars` | 迷你趋势条 | 高度与透明度随数值变化 |

**为何不使用第三方图表库**：

1. 需求仅需四类静态图表，引入 ECharts（约 1MB+）或 Recharts 会显著增加包体与依赖，与"演示项目零依赖启动"目标冲突；
2. 图表样式需与 Tailwind 主题（brand/ink 色板、圆角、阴影）严格一致，自研可直接使用同一套 token；
3. 图表尺寸固定、数据量小，无需缩放/缩放动画/坐标轴交互等高级能力；
4. 自研代码仅 198 行，可控、可讲、可改，符合课程项目的可讲解性要求（对应架构 ADR-09）。

### 4.3 布局组件（`components/Layout.tsx`，121 行）

固定 224px 深色侧边栏（`w-56`）+ 右侧内容区（`ml-56`）。菜单由 `MENUS` 常量定义，`ROLE_MENUS[user.role]` 过滤后渲染；"报价与审批"菜单在有待审批项时显示红色角标（数量来自 `pendingMyApproval`）。顶栏展示角色徽标、姓名部门、头像首字与退出按钮。导出 `PageHeader`（标题/描述/右侧动作）与 `FilterBar`（筛选控件容器）两个页面级复用组件。

---

## 5. 关键实现技巧

### 5.1 拖拽看板（HTML5 draggable）

```tsx
// 卡片：可拖拽
<div draggable
     onDragStart={() => { draggingRef.current = o.id }}
     onDragEnd={() => { draggingRef.current = null; setDragOver(null) }}
     onClick={() => setDetail(o)} />

// 列容器：接收放置
<div onDragOver={(e) => { e.preventDefault(); setDragOver(s.code) }}
     onDragLeave={() => setDragOver(null)}
     onDrop={() => handleDrop(s.code)} />
```

要点：

1. **不依赖 dataTransfer**：拖拽项 ID 存于 `useRef`（`draggingRef`），避免 `dataTransfer.getData` 在部分浏览器 `dragover` 阶段不可读的问题，同时不触发额外渲染；
2. **`preventDefault` 是必需的**：`onDragOver` 中必须调用，否则浏览器不会触发 `drop`；
3. **校验下沉到动作层**：`handleDrop` 调用 `moveStage(id, to, "看板拖拽推进至 X")`，返回 `{ ok, message }`，失败时 `toast(message, 'error')` 展示"不满足前置条件：…"，保证拖拽与点击两条入口共用同一套规则；
4. **拖拽与点击不冲突**：`onClick` 打开详情，拖拽结束不清空点击行为；同阶段放置直接忽略（`opp.stage === to` 时 return）。

### 5.2 抽屉与弹窗状态管理

统一采用"受控 + 局部 state + 空值即关闭"的模式：

| 模式 | 用法 | 示例 |
|---|---|---|
| 详情抽屉 | `detail: T \| null`，`open={!!detail}`，关闭置 `null` | `OpportunityDrawer`、`QuotationDrawer`、`OrderDrawer`、`CustomerDrawer` |
| 表单弹窗 | `createOpen: boolean` + 内部表单 state，提交后重置并关闭 | `CreateLeadModal`、`CreateQuotationModal` |
| 目标弹窗 | `target: { entity, action } \| null`，一个弹窗复用通过/驳回两种语义 | `approveTarget`、`auditTarget`、`closeTarget` |

子组件内部 `if (!x) return null` 早退，避免空值解引用；表单 state 在提交成功后显式重置，防止下次打开残留上次输入。

### 5.3 Toast 队列

`toast()` 以 `useRef` 自增序号生成 id 并入队，同时 `window.setTimeout(..., 3600)` 自动出队；`ToastHost` 在 `App.tsx` 根部渲染一次，与路由无关，任何页面动作都能反馈（NFR-U-05）。四种 tone 对应绿/红/黄/蓝四套配色，点击即关闭。

### 5.4 权限拦截（三层）

```tsx
// 第一层：菜单过滤（Layout.tsx）
const menus = MENUS.filter((m) => ROLE_MENUS[user.role].includes(m.key));

// 第二层：路径拦截（App.tsx）
const key = PATH_ROLE_KEY[location.pathname];
if (key && !ROLE_MENUS[user.role].includes(key)) return <权限不足卡片 />;

// 第三层：动作内校验（AppContext.tsx）
if (user.role !== 'FINANCE') { toast('权限不足：仅商务财务…（NFR-S-02）', 'error'); return; }
```

另加数据层可见性过滤（第四层，`selectors`），形成"看不见 / 进不去 / 点不了 / 查不出"的完整防线。

---

## 6. 技术难点与解决方案

| 编号 | 难点 | 现象 | 解决方案 |
|---|---|---|---|
| N-01 | React 18 严格模式下的重复副作用 | `useState` 初始化函数被双调用，可能重复生成演示数据或重复 Toast；在 `setDb` updater 内直接 `setToasts` 会触发"不能在更新函数中更新其他 state"告警 | 初始化逻辑设计为幂等（第二次执行时 `loadDb()` 已能读到首次写入的数据）；`commit` 内 Toast 通过 `window.setTimeout(..., 0)` 推到下一个宏任务，彻底规避 |
| N-02 | LocalStorage 写入失败 | 容量超限（QuotaExceededError）或隐私模式禁用存储，若静默失败会导致用户以为数据已保存 | `saveDb` 统一 `try/catch` 并包装为 `StorageError`，错误信息直接给出自救路径"请导出备份后重置数据"；`commit` 捕获后 Toast，同时保留内存态不回滚 |
| N-03 | 拖拽跨阶段校验 | 拖拽是连续交互，若校验放在 `dragover` 阶段无法拿到完整上下文，且失败后卡片已"视觉移动" | 校验放在 `drop` 时点，调用 `moveStage` 同步返回 `{ ok, message }`；失败仅 Toast 不改状态，卡片自动回到原列（受控渲染天然回滚） |
| N-04 | 金额浮点误差 | `0.1 + 0.2 = 0.30000000000000004`；多期拆分累加后与合同金额差 1 分 | 引入 `yuan(v) = Math.round(v*100)/100`，每一步运算后立即归一；回款计划采用"最后一期吸收尾差"（`plans[last].planAmount = yuan(order.amount - allocated)`），保证 Σ 期次 = 合同金额 |
| N-05 | 日期比较口径 | 日期既有 `YYYY-MM-DD`（`validUntil/planDate/signDate`）又有 `YYYY-MM-DD HH:mm`（`createdAt/at`），混用 `Date` 比较会因时区偏移产生一天误差 | 统一以 `YYYY-MM-DD` 字符串做字典序比较（`planDate < today()`、`validUntil < today()`），仅需要日期运算时用 `addDays`；时间字段只做展示与排序 |
| N-06 | 编号生成与重置冲突 | 重置演示数据后若计数器未复位，新编号会与历史 ID 重复 | `primeAll()` 在装载/重置时遍历各实体已有 ID，`primeCounter` 取出当前年份下的最大序号作为起点；`resetCounters()` 先清空再 prime |
| N-07 | Context 变更引起的全量重渲染 | 单个动作触发 `db` 替换，所有页面组件重新计算 | 动作全部 `useCallback` 稳定引用；页面派生结果全部 `useMemo`；高频交互（拖拽、临时输入）使用 `useRef`/局部 state，不进全局 |
| N-08 | 撞单与重复建档的业务歧义 | 同一客户可能被重复建档或重复开商机 | 转化时按客户名做唯一性前置校验（BR-02）并中止；创建商机时仅告警不阻断（BR-09），把决策权留给业务人员 |

---

## 7. 代码质量措施

### 7.1 类型与编译

| 措施 | 配置/做法 |
|---|---|
| 严格模式 | `tsconfig`：`strict: true` |
| 消除死代码 | `noUnusedLocals: true`、`noUnusedParameters: true`（编译期强制，杜绝僵尸变量） |
| 其他 | `noFallthroughCasesInSwitch: true`、`isolatedModules: true`、`skipLibCheck: true` |
| 独立检查 | `npm run typecheck`（`tsc --noEmit`）与 `npm run build`（`tsc -b && vite build`）双重保障 |
| 类型来源 | 领域模型集中在 `types.ts`，页面通过 `Omit<...>` 复用，避免重复定义；禁止 `any` |

### 7.2 单一职责

| 层 | 职责边界 |
|---|---|
| `pages` | 只做布局、表单采集、调用动作、展示结果；不含业务规则判断 |
| `store/AppContext` | 只做状态变更与规则校验；不含 JSX |
| `store/selectors` | 只做只读派生；不写状态 |
| `lib` | 只做无状态工具；不认识业务概念 |
| `components` | 只做展示；不认识数据来源（通过 props 与 `useApp` 解耦） |

### 7.3 常量集中

所有可能变化的业务参数集中在 `config/businessRules.ts`：阶段与赢率、审批阈值（0.15 / 0.3 / 100 万）、客户等级阈值（50 万 / 10 万）、回款计划模板、角色菜单、枚举字典、状态展示字典。页面直接读取常量渲染提示文案（如报价页标题动态展示阈值），实现"改一处、全局生效"（NFR-M-01）。

### 7.4 命名与注释规范

| 项 | 规范 |
|---|---|
| 文件 | 页面 PascalCase（`Leads.tsx`），工具 camelCase（`storage.ts`） |
| 组件 | PascalCase 具名导出（`FunnelChart`、`PageHeader`）；页面默认导出 |
| 动作 | 动词短语（`createQuotation`、`moveStage`、`confirmPayment`） |
| 注释 | 每个文件顶部一句话说明职责；业务动作处标注对应需求/规则编号（如 `// FR-07-04：自动生成回款计划`、`// NFR-R-02：写入失败不得静默失败`、`// BR-07：未确认不计入`） |
| 提交反馈 | 成功与失败文案统一走 Toast，失败文案带规则编号便于定位 |

### 7.5 自测与验收支撑

| 项 | 做法 |
|---|---|
| 一键启动 | `npm install && npm run dev`（NFR-T-02） |
| 演示数据 | 覆盖全部状态机状态，含逾期回款、已驳回报价、输单商机、废弃线索等异常样本 |
| 端到端演示 | 支持 SRS 7.2 的十步主成功场景：分配线索 → 跟进 → 转化 → 建商机 → 报价 20% → 一级审批 → 通过 → 生成订单 → 商务审核 → 登记/确认回款 → 看板刷新 |
| 数据可恢复 | Admin 页导出 JSON 与一键重置演示数据 |

---

**评审记录**

| 角色 | 意见 | 日期 |
|---|---|---|
| 开发负责人 | 同意通过 | 2026-10-09 |
| 测试负责人 | 同意通过 | 2026-10-09 |
