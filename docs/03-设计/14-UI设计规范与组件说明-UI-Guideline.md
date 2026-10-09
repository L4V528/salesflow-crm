# UI 设计规范与组件说明（UI Guideline）

| 项 | 内容 |
|---|---|
| 文档编号 | SFS-CRM-UI-01 |
| 项目名称 | SalesFlow 智销云 · 销售全流程管理平台（Vite + React + TS + Tailwind） |
| 版本 | v1.0 |
| 编写日期 | 2026-10-09 |
| 状态 | 已评审，作为开发实现与走查依据 |

**关联文档**：《软件需求规格说明书》SFS-CRM-SRS（FR-01~FR-10、NFR-U、NFR-M-01）、《原型设计说明书》SFS-CRM-PRO-01、《详细设计说明书》SFS-CRM-DD-01。

**版本变更历史**

| 版本 | 日期 | 修订说明 | 状态 |
|---|---|---|---|
| v0.5 | 2026-10-05 | 确立色板、字号阶梯与基础组件清单 | 草稿 |
| v0.9 | 2026-10-07 | 按原型评审意见补充状态-颜色映射表与空/错/禁用态 | 评审稿 |
| v1.0 | 2026-10-09 | 对齐组件库实现（`src/components/ui/index.tsx`）逐项校准视觉规格 | 已发布 |

---

## 1. 引言

### 1.1 编写目的

本文档定义 SalesFlow CRM 的**界面设计语言、布局规则、组件规范、数据展示与交互规范**，作为前端开发实现、UI 走查、测试用例编写与版本迭代的一致性基准。本文所列色值、字号、间距、组件 Props 均取自项目真实实现文件：

| 依据文件 | 提供的约束 |
|---|---|
| `app/tailwind.config.js` | brand / ink 双色板、字体栈、shadow-card / shadow-pop |
| `app/src/components/ui/index.tsx` | 全部基础组件的 Props 与默认样式 |
| `app/src/components/Layout.tsx` | 侧边导航 224px、顶栏 56px、PageHeader / FilterBar |
| `app/src/config/businessRules.ts` | 状态字典（label + tone）、审批阈值、阶段赢率 |
| `app/src/lib/format.ts` | 金额、日期、脱敏、百分比的统一格式化规则 |

### 1.2 适用范围

适用于本项目全部 10 个页面（P01 登录 ~ P10 系统管理）的界面设计与前端实现。**本期目标是 PC 桌面端，不做移动端适配**，响应式仅做兜底（见 4.5）。

### 1.3 术语

| 术语 | 说明 |
|---|---|
| tone | 语义色调，`'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary'`，驱动 Badge / StatCard / Progress / Toast 的配色 |
| variant | 组件的视觉变体，本文特指 Button 的 5 种变体 |
| dense | 卡片去内边距模式（`Card` 的 `dense` 属性），用于内部自绘 padding 的场景 |
| 内容区 | 顶栏以下、可滚动的 `<main className="flex-1 p-6">` 区域 |

---

## 2. 设计目标与原则

### 2.1 设计目标

| 编号 | 目标 | 可度量判据 |
|---|---|---|
| G-01 | **专业可信**：界面观感贴近企业级 SaaS，冷色主色 + 克制的中性灰 | 主色仅用于品牌标识、主操作、选中态，页面主色占比 ≤ 15% |
| G-02 | **密度适中**：一屏内看到尽量多的业务数据，但不拥挤 | 1440×900 下列表首屏 ≥ 12 行；表格行高 ≤ 48px（NFR-U-07） |
| G-03 | **信息优先**：装饰服从信息，任何元素存在必须有信息价值 | 卡片不使用渐变、不使用大块插画；图表无色块背景 |
| G-04 | **一致性强**：同一语义在任何页面使用同一组件、同一颜色、同一文案 | 状态标记一律用 `Badge` + `businessRules.ts` 的 tone 字典 |
| G-05 | **好用可学**：核心任务 3 次点击内完成（NFR-U-01） | 创建商机、提交报价、登记回款 ≤ 3 次点击可达操作入口 |

### 2.2 设计原则

1. **业务状态可一眼识别**：状态、钱、日期是 CRM 的高频信息，统一用 Badge + tone 字典表达，禁止各页面自定义颜色。
2. **同一动作同一位置**：所有列表页的「新建」按钮固定在 PageHeader 右侧；所有「详情」固定在行操作首列；所有主操作固定在 Modal / Drawer 右下角。
3. **先禁灰，后报错**：能提前判断不可用（未到期、金额已满、无权限）时，优先 `disabled` 按钮，而不是让用户点完再报错；无法预判的校验（阶段前置条件、回款超额）则操作时返回明确原因。
4. **不静默失败**：任何失败都必须有 Toast 文案说明具体原因（NFR-U-05）。
5. **规则集中配置**：审批阈值、阶段赢率、客户等级阈值、枚举字典全部来自 `businessRules.ts`，组件不得硬编码（NFR-M-01）。

---

## 3. 设计语言

### 3.1 色彩体系

系统采用**双色板 + Tailwind 默认语义色**的三层结构：

- `brand`：品牌蓝，用于品牌标识、主操作、选中/激活状态；
- `ink`：中性蓝灰，用于文字、边框、背景、分割线；
- 语义色：直接复用 Tailwind 调色板中的 `emerald / amber / rose / sky / white`，用于 Badge、Button 危险/成功态、Toast、Stepper。

#### 3.1.1 brand 色板（取自 `tailwind.config.js`）

| Token | 色值 | 主要用途 | 禁止用法 |
|---|---|---|---|
| `brand-50` | `#eef4ff` | Badge primary 底色、StatCard primary 图标底、Align 提示区块底色 | 禁止作为大面积页面背景 |
| `brand-100` | `#dbe6ff` | 头像底色、Input 聚焦光环（`ring-brand-100`）、时间线节点底色 | 禁止用于正文文字底色 |
| `brand-200` | `#bed0ff` | Badge primary 描边（`ring-brand-200`）、批量操作条边框 | — |
| `brand-300` | `#91b0ff` | 卡片 hover 边框（`hover:border-brand-300`）、登录页演示账号卡 hover 边框 | 禁止用于正文文字（对比度不足） |
| `brand-400` | `#5f87fb` | 登录页品牌区的项目符号 ● | 禁止用于正文文字 |
| `brand-500` | `#3b62f6` | Input / Select / Textarea **聚焦边框**色（`focus:border-brand-500`） | 禁止作为按钮常态底色 |
| `brand-600` | `#2544eb` | **主色**：Primary 按钮底色、侧栏选中项底色、品牌 Logo 方块、Tabs 激活下划线、Progress 主色条 | 禁止叠加深色文字；按钮上只配白字 |
| `brand-700` | `#1d34d8` | Primary 按钮 hover、avatar / Badge / StatCard primary 文字色 | — |
| `brand-800` | `#1e2eaf` | 品牌信息区标题强调（登录页） | 禁止大面积铺底 |
| `brand-900` | `#1e2d8a` | 深色下的品牌强调，本期未大面积使用 | — |

#### 3.1.2 ink 色板（取自 `tailwind.config.js`）

| Token | 色值 | 主要用途 | 禁止用法 |
|---|---|---|---|
| `ink-50` | `#f6f7f9` | **应用背景**（`body` / Layout 根容器）、表头 `bg-ink-50`、信息区块底色 | 禁止作为卡片底色（卡片必须白底） |
| `ink-100` | `#eceef2` | 分割线（卡片头、Modal/Drawer 头脚）、Progress 轨道底色 | 禁止作为可点击元素唯一区分手段 |
| `ink-200` | `#d9dde5` | **卡片/输入控件默认边框**、Badge neutral 描边、空列虚线框 | — |
| `ink-300` | `#b9c0cd` | 默认 Button 边框、面包屑分隔符、滚动条滑块、Disabled Stepper 圆点 | 禁止在白底承载正文 |
| `ink-400` | `#8d97a8` | 辅助说明文字（编号、来源、创建人）、Field hint、取消类图标按钮 | 禁止用于需要精确读值的金额/日期 |
| `ink-500` | `#6b7688` | 次要文字（StatCard label、EmptyState 文案、表内次要信息） | — |
| `ink-600` | `#525c6e` | Field label、Badge neutral 文字、次级正文 | — |
| `ink-700` | `#414a59` | **表格正文 `Td` 默认色**、侧栏次级信息、默认 Button 文字 | — |
| `ink-800` | `#2f3540` | 卡片标题、列表主标题、正文强调；导航 hover 背景 `hover:bg-ink-800` | — |
| `ink-900` | `#1c2027` | **页面标题 `PageHeader`、Modal/Drawer 标题、数值大字**；侧栏底色；遮罩 `bg-ink-900/40` | 禁止与阴影叠加做卡片背景 |

#### 3.1.3 色彩使用总则

| 规则 | 说明 |
|---|---|
| R-C-01 | 白底卡片内的正文最低对比级别为 `ink-700`，不得使用 `ink-400` 承载需阅读的数据 |
| R-C-02 | 界面的白底色只出现于：卡片、弹层、输入控件、`Layout` 顶栏；其余区域使用 `ink-50` |
| R-C-03 | 任何页面**不得**引入上述两套色板之外的自定义 HEX（图表系列色除外，见 6.5） |
| R-C-04 | 深色背景（侧栏 `ink-900`、登录品牌区 `ink-900`）上文字使用白 / `ink-100` / `ink-400` / `ink-500`，禁止用 `ink-700` 以上深灰 |

### 3.2 语义色规范

系统定义 6 种 tone，通过 `Badge` 组件落地，并被 StatCard、Progress、Stepper、Toast 复用。**同一 tone 在不同组件上的语义必须一致**。

| tone | 语义 | Badge 视觉（bg / text / ring） | 典型业务场景 |
|---|---|---|---|
| `neutral` | 中性、未完成、已终止 | `bg-ink-100` / `text-ink-600` / `ring-ink-200` | 草稿、已废弃、未开票、未回款、客户 C 级、线索意向低 |
| `info` | 进行中、信息提示 | `bg-sky-50` / `text-sky-700` / `ring-sky-200` | 跟进中的线索、执行中/已签约订单、已开票、已转订单、StatCard 无代办 |
| `success` | 成功、达成、正常 | `bg-emerald-50` / `text-emerald-700` / `ring-emerald-200` | 已转化线索、报价已通过、订单已完成、期次已回款、回款已确认、已寄出发票 |
| `warning` | 需注意、待处理 | `bg-amber-50` / `text-amber-700` / `ring-amber-200` | 待分配线索、审批中、待签约、部分回款、待确认回款、客户 B 级、线索意向中 |
| `danger` | 异常、拒绝、逾期、高优先级 | `bg-rose-50` / `text-rose-700` / `ring-rose-200` | 报价已驳回、期次逾期、客户 A 级（金额高需重点对待）、线索意向高、折扣率 ≥ 30% |
| `primary` | 品牌相关、归属强调 | `bg-brand-50` / `text-brand-700` / `ring-brand-200` | 主联系人、顶栏角色标识、执行中订单（第二语义）、"需我处理"强调 |

> **说明**：`danger` 用于「客户 A 级」「线索意向高」属于**注意力强调**而非失败语义，这是本项目的既定约定（见 3.2.1 映射表），全项目统一，不得在个别页面改为 success。

#### 3.2.1 业务状态 → 颜色映射表（实现口径）

状态字典集中在 `src/config/businessRules.ts`，所有列表与详情必须查表渲染，**禁止在页面中写 `if status === 'X' return 'green'` 之类散落逻辑**。

| 业务对象 | 状态（枚举） | 显示文案 | tone |
|---|---|---|---|
| 线索 Lead | `NEW` | 待分配 | warning |
| 线索 Lead | `FOLLOWING` | 跟进中 | info |
| 线索 Lead | `CONVERTED` | 已转化 | success |
| 线索 Lead | `LOST` | 已废弃 | neutral |
| 线索意向等级 | `HIGH` / `MID` / `LOW` | 高 / 中 / 低 | danger / warning / neutral |
| 客户等级 | `A` / `B` / `C` | A 级 / B 级 / C 级（人工覆盖追加"（人工）"） | danger / warning / neutral |
| 报价单 Quotation | `DRAFT` | 草稿 | neutral |
| 报价单 Quotation | `APPROVING` | 审批中 | warning |
| 报价单 Quotation | `APPROVED` | 已通过 | success |
| 报价单 Quotation | `REJECTED` | 已驳回 | danger |
| 报价单 Quotation | `CONVERTED` | 已转订单 | info |
| 报价单 Quotation | 超有效期（`validUntil < today()`） | 已过期（覆盖状态文案） | neutral |
| 订单 Order | `PENDING` | 待签约 | warning |
| 订单 Order | `SIGNED` | 已签约 | info |
| 订单 Order | `EXECUTING` | 执行中 | primary |
| 订单 Order | `COMPLETED` | 已完成 | success |
| 订单 Order | `CANCELLED` | 已取消 | neutral |
| 回款计划 Plan | `UNPAID` | 未回款 | neutral |
| 回款计划 Plan | `PARTIAL` | 部分回款 | warning |
| 回款计划 Plan | `PAID` | 已回款 | success |
| 回款计划 Plan | `OVERDUE` | 逾期 | danger |
| 回款记录 Payment | `REGISTERED` | 待确认 | warning |
| 回款记录 Payment | `CONFIRMED` | 已确认 | success |
| 发票 Invoice | `NONE` / `ISSUED` / `SENT` | 未开票 / 已开票 / 已寄出 | neutral / info / success |
| 审批链节点 | `APPROVED` / `REJECTED` / `PENDING` | 审批人姓名 + ✓ / ✕ / … | success / danger / warning |
| 商机阶段跳转按钮 | 已过阶段 / 当前阶段 / 未来阶段 | `S1 初步接洽` … | emerald-50 / 阶段本色白字 / ink-100 |

**逾期与到期（非 Badge 场景）的红字规则**：当日日期晚于计划日期/有效期时，对应单元格文字转 `text-rose-600`（线索下次跟进日、报价有效期、回款计划日期、商机预计成交日追加「已逾期」标记），逾期行追加背景 `bg-rose-50/40`。

### 3.3 字体与字号

#### 3.3.1 字体栈

```text
-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif
```

配置于 `tailwind.config.js` 的 `fontFamily.sans`，全局在 `index.css` 的 `body` 上生效，**页面不得再单独声明字体**。数字默认开启 `'tnum'`（等宽数字），金额/比例单元格额外追加 `className="num"`，保证竖列对齐。

#### 3.3.2 字号阶梯

| 级别 | 字号 | Tailwind 类 | 行高 | 适用场景 | 颜色默认 |
|---|---|---|---|---|---|
| T0 | 10px | `text-[10px]` | — | 侧栏审批红点计数、时间线节点图标、区分子项超限后缀 | 白 / `ink-400` |
| T1 | 11px | `text-[11px]` | — | 侧栏版本号、FalseHints 辅助说明（如"仅限数字"）、卡片副统计行、"第 N 期/余量" | `ink-400` / `ink-500` |
| T2 | 12px | `text-xs` | 常规 | **表格主数据、Badge、Field label / hint / error、表头、筛选标签、Toast 正文（14→12 时）** | `ink-700` |
| T3 | 13px | `text-[13px]`（非标准档） | 常规 | 备用档：枢纽信息次级强调。**当前版本未使用**；如需启用必须走 Token 追加评审 | — |
| T4 | 14px | `text-sm` | 常规 | **正文基准**：表格/抽屉正文、按钮 md、Tabs、Card 标题、Toast 正文 | `ink-700` / `ink-800` |
| T5 | 16px | `text-base` | 常规 | Modal / Drawer 标题、详情 KPI 数值、页面级数据 | `ink-900` |
| T6 | 18px | `text-lg` | snug | `PageHeader` 页面标题、详情块 KPI 数值 | `ink-900` |
| T7 | 24px | `text-2xl` | — | StatCard 数值、阶段汇总计数、KPI 数值 | `ink-900` |
| T8 | 30px | `text-3xl` | snug | 仅登录页品牌区主标语 | 白 |

> **注意**：Tailwind 默认比例尺不含 13px。若后续需要该档，必须以 `text-[13px]` 形式使用并在本文档登记，不得临时散写 `style={{fontSize:13}}`。

**字重**：正文 `font-normal`；表单 label / 表头 / 卡片标题 / 抽屉分区标题 / 按钮 / 数值用 `font-medium`~`font-semibold`；页面标题 `font-semibold`；登录品牌标语 `font-semibold`。**禁止使用 `font-bold`**（仅 Logo 方块「S」例外）。

### 3.4 间距与圆角

#### 3.4.1 4px 网格

所有间距取 Tailwind 默认 4px 步进值，常用组合：

| 场景 | 类 | 像素 |
|---|---|---|
| 页面内容区外边距 | `p-6` | 24 |
| 模块块间距（垂直大块） | `mb-5` / `space-y-5` | 20 |
| 网格间距（StatCard / 概览卡） | `gap-4` | 16 |
| 网格间距（图表类大卡） | `gap-5` | 20 |
| 网格间距（小尺寸汇总卡） | `gap-3` | 12 |
| **卡片内边距** | `p-4` | 16 |
| 抽屉 / 弹窗头脚内边距 | `px-5 py-3.5` | 横 20 / 纵 14 |
| 抽屉 / 弹窗正文内边距 | `px-5 py-4` | 横 20 / 纵 16 |
| 抽屉头部信息块、KPI 小卡 | `p-3` | 12 |
| **表格单元格** | `px-3 py-2.5` | 横 12 / 纵 10 |
| FilterBar 内边距与控件间距 | `p-3` / `gap-3` | 12 |
| 表单字段垂直间距 | `space-y-3` ~ `space-y-4` | 12 ~ 16 |
| 图标与文字间距 | `gap-1` / `gap-1.5` | 4 / 6 |
| 按钮组间距 | `gap-1` / `gap-2` | 4 / 8 |

**垂直节奏模板**：`PageHeader(mb-5)` → `概览卡区(mb-4/mb-5)` → `FilterBar(mb-3)` → `内容卡` → `补充卡(mt-5)`。

#### 3.4.2 圆角规格

| 元素 | 类 | 半径 |
|---|---|---|
| Logo 方块（侧栏/登录）、StatCard 图标、`bg-ink-50` KPI 小卡、表单控件（Input/Select/Textarea）、Button、Toast、列表行卡片 | `rounded-md` | 6px |
| Badge | `rounded` | 4px |
| Card、Modal、Drawer、FilterBar、看板列容器、商机看板卡片 | `rounded-lg` | 8px |
| 头像、驳回/完成计数红点、Stepper 节点、Progress 条 | `rounded-full` | 9999px |

同一容器内不得混用同尺度不同圆角；卡片内部按钮一律 `rounded-md`，不因父级圆角而变化。

### 3.5 阴影层级

| Token | 定义 | 使用场景 | 禁止 |
|---|---|---|---|
| `shadow-card` | `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)` | Card、StatCard、KPI 小卡、列表行卡片、商机看板卡片的**常态** | 不用于浮层（Modal/Drawer/Toast/Select 展开） |
| `shadow-pop` | `0 12px 32px rgba(16,24,40,.12)` | Modal、Drawer、Toast，以及可点击 Card 的 **hover 抬升**（搭配 `hover:border-brand-300`） | 不用于静态列表行；不得叠加多层 shadow |

**层级（z-index）**：内容 < Sticky 顶栏 `z-20` < 侧栏 `z-30` < Modal / Drawer `z-50` < ToastHost `z-[100]`。

---

## 4. 布局规范

### 4.1 整体框架

采用「**左侧固定深色导航 + 右侧浅色内容区**」的经典后台布局（见 `src/components/Layout.tsx`）：

```text
+------------------------+------------------------------------------------------+
|  SIDEBAR               |  HEADER (sticky top-0, z-20, h-56px, bg-white)      |
|  fixed left-0 top-0    |  A: 面包屑文案                 B: 角色Badge/姓名/头像/退出 |
|  w-224px h-screen      +------------------------------------------------------+
|  bg-ink-900 text-ink-  |                                                      |
|  100                   |  <main className="flex-1 p-6">                       |
|                        |  +------------------------------------------------+ |
|  [S] SalesFlow         |  | A1  PageHeader（标题+描述 | 操作按钮组）        | |
|      智销云 CRM        |  +------------------------------------------------+ |
|                        |  | A2  概览卡区（grid-cols-4 / 5，StatCard/KPI）   | |
|  > 工作台              |  +------------------------------------------------+ |
|    线索管理            |  | A3  FilterBar（Field 组 + 重置 + ml-auto 区）   | |
|    客户管理            |  +------------------------------------------------+ |
|    商机看板            |  | A4  内容区（表格 / 看板 / 图表网格）            | |
|    报价与审批   (3)    |  |                                                | |
|    合同订单            |  |                                                | |
|    回款管理            |  +------------------------------------------------+ |
|    数据看板            |  | A5  下方补充卡（mt-5，最近动态/结果分析）       | |
|    系统管理            |  +------------------------------------------------+ |
|                        |                                                      |
|  --------------------  |                                                      |
|  v1.0.0 / 课程演示版   |                                                      |
+------------------------+------------------------------------------------------+
```

**尺寸常量表**

| 区域 | 类 | 尺寸 |
|---|---|---|
| 侧栏宽度 | `w-56` | 224px（固定，不折叠） |
| 顶栏高度 | `h-14` | 56px（sticky） |
| 内容区外边距 | `p-6` | 24px |
| 内容区可视宽度（1440 视口） | — | 1440 − 224 − 48 = **1168px** |
| 表格最小宽度 | `min-w-[720px]` | 720px，超出由 `overflow-x-auto` 横向滚动 |

### 4.2 栅格

概念栅格为 **12 栏**；因内容区实际宽度 1168px，页面统一使用 Tailwind 的等分网格类而非 `col-span-n` 手工拼：

| 语义 | 类 | 等价栏数 | 使用页面 |
|---|---|---|---|
| 双列图表 | `grid-cols-2` | 6 + 6 | P09 数据看板（漏斗/排行/趋势/来源） |
| 主辅三列 | `grid-cols-3` + 主区 `col-span-2` | 8 + 4 | P02 工作台（今日跟进/待办 + 漏斗栏） |
| 主辅四列 | `grid-cols-4` + 主区 `col-span-3` | 9 + 3 | P03 线索管理（列表 + 来源饼图） |
| 均分四列 | `grid-cols-4` | 3 × 4 | P02 StatCard、P08 StatCard、P03 状态概览 |
| 均分五列 | `grid-cols-5` | — | P05 阶段汇总 + 看板 5 列、P07 订单状态概览、P09 KPI |

### 4.3 页面标准结构

所有内页遵循 **PageHeader → （概览卡）→ FilterBar → 内容卡** 四段式：

```text
┌ PageHeader ─────────────────────────────────────────────────────┐
│ 页面标题 (text-lg font-semibold ink-900)   │  [+ 新建 X] [次要]  │
│ 页面描述 (text-xs ink-500)                 │                     │
└─────────────────────────────────────────────────────────────────┘
┌ 概览卡区（可选，grid-cols-4/5, mb-4~5）─────────────────────────┐
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                        │
│ │ label │ │ label │ │ label │ │ label │                        │
│ │ value │ │ value │ │ value │ │ value │                        │
│ └───────┘ └───────┘ └───────┘ └───────┘                        │
└─────────────────────────────────────────────────────────────────┘
┌ FilterBar (bg-white border rounded-lg p-3 mb-3) ────────────────┐
│ [关键词] [状态▾] [来源▾] [归属▾]  [重置]      ml-auto: [Tabs]    │
└─────────────────────────────────────────────────────────────────┘
┌ Card (dense) ───────────────────────────────────────────────────┐
│ Table / Kanban / Charts                                          │
└─────────────────────────────────────────────────────────────────┘
```

**页面结构选型表**

| 类型 | 结构 | 页面 |
|---|---|---|
| Ⅰ 混合工作台 | PageHeader + 4 张 StatCard + 预警条（条件渲染）+ 2/1 分栏 + 最近动态 | P02 |
| Ⅱ 主辅列表 | …+ 概览卡 + FilterBar（`col-span-3` 主区 + 右侧统计栏） | P03 |
| Ⅲ 全宽列表 | FilterBar + 全宽 Card(Table) + 详情 Drawer | P04、P06、P07、P08 |
| Ⅳ 看板 | 阶段汇总 + FilterBar（内含 Tabs `ml-auto`）+ 5 列 Kanban | P05 |
| Ⅴ 图表页 | FilterBar + 5 张 KPI + 2 列图表网格 + 结果分析 | P09 |
| Ⅵ 登录页 | 46% 深色品牌区 + 54% 白色表单区（不套 Layout） | P01 |

### 4.4 页面标题与模块标题

| 层级 | 元素 | 样式 |
|---|---|---|
| H1 页面标题 | `PageHeader title` | `text-lg font-semibold text-ink-900` |
| H2 模块标题 | `Card title` | `text-sm font-semibold text-ink-800` |
| H3 分区标题（抽屉内） | 自绘 `<div>` | `text-sm font-semibold text-ink-800` |
| H4 表单分组 | 自绘 `<div>` | `text-xs font-medium text-ink-600` |

### 4.5 响应式兜底

本期目标 PC（≥1440×900），响应式**只做不破版兜底，不做移动端适配**：

| 视口 | 表现 | 要求 |
|---|---|---|
| ≥ 1440px | 标准布局，内容区 1168px | 基准设计稿 |
| 1280 ~ 1439px | 网格保持列数，表格横向滚动，统计卡文字不换行 | 不得溢出/错位 |
| 1024 ~ 1279px | `filter/list` 的 `w-52` 等固定宽输入框挤压；FilterBar 自动换行（`flex-wrap`） | 允许横向滚动条，功能不缺失 |
| < 1024px | 不保证可用性 | 显示提示：建议使用 ≥1366px 分辨率访问（由部署页提示，非应用内） |

---

## 5. 组件规范

> 本节逐组件说明。「视觉规格」均按已实现的 Tailwind 类描述；「Props 表」与 `src/components/ui/index.tsx` 完全一致；「禁忌」为强制约束，UI 走查逐条核对。

统一约定：所有组件从 `@/components/ui` 具名导入；布局组件 `PageHeader` / `FilterBar` 从 `@/components/Layout` 导入；样式合并一律使用导出工具函数 `cn(...)`。

### 5.1 Card

**用途**：页面内容容器，承载「表头（标题 + 右侧操作）+ 内容」结构。所有列表、图表、统计块的最小外层容器。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `title` | `React.ReactNode` | — | 卡片标题，渲染为 `<h3>`；与 `extra` 任一存在才渲染卡头与分割线 |
| `extra` | `React.ReactNode` | — | 卡头右侧操作区（通常是 `Button size="sm" variant="ghost"`） |
| `children` | `React.ReactNode` | 必填 | 卡片内容 |
| `className` | `string` | — | 追加到根节点（如 `mt-5`、`col-span-2`） |
| `bodyClassName` | `string` | — | 追加到内容容器 |
| `dense` | `boolean` | `false` | `true` 时内容区 `p-0`，用于直接放 `Table` 或自绘 padding 的场景 |

**视觉规格**：根 `rounded-lg border border-ink-200 bg-white shadow-card`；卡头 `flex items-center justify-between border-b border-ink-100 px-4 py-3`，标题 `text-sm font-semibold text-ink-800`，操作区 `flex items-center gap-2`；内容区 `p-4`（非 dense）。

```tsx
<Card title="今日待跟进" extra={<Button size="sm" variant="ghost">全部线索</Button>}>
  <Table head={/* ... */}>{/* ... */}</Table>
</Card>

<Card dense>
  <div className="p-3">自绘内边距的汇总块</div>
</Card>
```

**禁忌**
1. 禁止在 `dense` 时直接放裸表格并忘记表头/单元格 padding —— dense 仅用于内含 `Table` 或自绘 `p-3/p-4` 的情况。
2. 禁止 Card 嵌套 Card 做视觉分组（改用自绘 `rounded-md border p-3` 区块）。
3. 禁止给卡片加自定义色背景或渐变；补充信息用 `bg-ink-50` 内嵌块。
4. 卡头操作按钮不得超过 2 个，且必须为 `size="sm"`。

### 5.2 Button

**用途**：触发动作。支持 5 种 variant × 2 种 size。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `children` | `React.ReactNode` | 必填 | 按钮文案（可含图标字符） |
| `onClick` | `() => void` | — | 点击回调 |
| `variant` | `'primary' \| 'default' \| 'ghost' \| 'danger' \| 'success'` | `'default'` | 视觉变体 |
| `size` | `'sm' \| 'md'` | `'md'` | 尺寸 |
| `disabled` | `boolean` | `false` | 禁用，自动 `opacity-50 cursor-not-allowed` |
| `type` | `'button' \| 'submit'` | `'button'` | 原生类型 |
| `className` | `string` | — | 追加类（常用 `w-full`，如登录按钮） |
| `title` | `string` | — | 原生 tooltip，用于承载禁用原因说明或阶段前置条件 |

**尺寸规格**

| size | 类 | 高度 | 内边距 | 字号 |
|---|---|---|---|---|
| `sm` | `h-7 px-2.5 text-xs` | 28px | 横 10px | 12px |
| `md` | `h-9 px-3.5 text-sm` | 36px | 横 14px | 14px |

**变体规格与语义**

| variant | 类 | 用途 | 每页建议数量 |
|---|---|---|---|
| `primary` | `bg-brand-600 text-white hover:bg-brand-700` | **主操作**：新建、提交、保存、去审批、生成订单、开始交付 | ≤ 1 个（PageHeader/弹窗脚） |
| `default` | `border border-ink-300 bg-white text-ink-700 hover:bg-ink-50` | 中性操作：重置、撤回、取消、交付推进 | 不限 |
| `ghost` | `text-ink-600 hover:bg-ink-100` | 弱操作：列表行内的「跟进/详情/转化/废弃/删除」、卡头「全部」 | 不限 |
| `danger` | `bg-rose-600 text-white hover:bg-rose-700` | 破坏性：确认废弃、驳回、标记输单 | 需二次确认（见 7.2） |
| `success` | `bg-emerald-600 text-white hover:bg-emerald-700` | 通过类：审批通过、审核通过、确认到账、标记赢单 | — |

```tsx
<Button variant="primary" onClick={() => setCreateOpen(true)}>+ 新建线索</Button>
<Button size="sm" variant="ghost" onClick={() => setDetail(row)}>详情</Button>
<Button size="sm" variant="danger" disabled={rows.length === 1}>删除</Button>
<Button variant="success" onClick={() => onApprove('APPROVED')}>审批通过</Button>
```

**禁忌**
1. 一个 PageHeader / 一个 Modal footer 内只能有 1 个 `primary`。
2. 禁止用 `danger` 表达「不重要」；`danger` 只表达「会造成不可逆结果或明确拒绝」。
3. 禁止用 `className` 覆盖 variant 的底色（如给 default 加 `bg-brand-600`）；需要新变体应先改组件库。
4. 禁用态必须在 `title` 或相邻说明中给出原因，不允许「灰着但不说为什么」。
5. 禁止在表格行内使用 `md` 尺寸（会把行高顶到 48px 以上）。

### 5.3 Badge

**用途**：表达状态、等级、标签。必须搭配 `businessRules.ts` 的状态字典使用。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `children` | `React.ReactNode` | 必填 | 文案，建议 ≤ 6 字 |
| `tone` | `Tone`（6 选 1） | `'neutral'` | 语义色调，见 3.2 |
| `className` | `string` | — | 追加类 |

**视觉规格**：`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset` + tone 三色组。高度约 20px，可安全放入表格单元格。

```tsx
<Badge tone={LEAD_STATUS[lead.status].tone}>{LEAD_STATUS[lead.status].label}</Badge>
<Badge tone={q.discountRate >= 0.3 ? 'danger' : 'warning'}>{(q.discountRate * 100).toFixed(1)}%</Badge>
<Badge tone="primary">主联系人</Badge>
```

**禁忌**
1. 禁止使用颜色之外的隐式语义：Badge 必须带文字（不得只用色块）。
2. 禁止用 Badge 承载长文本或可点击行为（它不是按钮）。
3. 同一业务状态在不同页面的 tone 必须一致，以 3.2.1 表为准。
4. 禁止在 `StatCard` 数值、`PageHeader` 标题处使用 Badge 做大字强调。

### 5.4 Field

**用途**：表单字段容器，统一承载标签、必填星号、控件、说明与错误。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `label` | `string` | 必填 | 字段标签，`mb-1 block text-xs font-medium text-ink-600` |
| `required` | `boolean` | `false` | 显示红色 `*`（`ml-0.5 text-rose-500`） |
| `children` | `React.ReactNode` | 必填 | 表单控件 |
| `hint` | `string` | — | 辅助说明（`text-xs text-ink-400`），无 error 时显示 |
| `error` | `string` | — | 错误文案（`text-xs text-rose-600`），优先级高于 hint |

**视觉规格**：根为 `<label>`，**隐式关联内部控件**（点击标签即聚焦），天然满足可访问性要求；`error` 与 `hint` 同时只显示其一。

```tsx
<Field label="废弃原因" required hint="依据 BR-01，废弃线索必须填写原因">
  <Select value={loseReason} onChange={/* ... */}>{/* ... */}</Select>
</Field>

<Field label="密码" required error={error}>
  <Input type="password" value={password} onChange={/* ... */} />
</Field>
```

**禁忌**
1. `required` 仅做视觉标识，**不代表已校验**；提交时仍需显式校验（见 7.4）。
2. 禁止把多个控件塞进同一个 Field（一个 Field = 一个控件）。
3. 禁止用 `error` 承载普通提示，红字只用于错误。

### 5.5 Input

**用途**：单行文本/数字/日期输入。直接透传原生 `<input>` 属性。

| Prop | 说明 |
|---|---|
| 其余 | `React.InputHTMLAttributes<HTMLInputElement>`（含 `value/onChange/placeholder/type/min/max/step/disabled`） |
| `className` | 与内置类合并（常用 `w-52`、`w-20 text-right`、`w-full`） |

**视觉规格**：`h-9 w-full rounded-md border border-ink-300 bg-white px-3 text-sm text-ink-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100`（默认宽度撑满父容器，筛选栏需显式指定宽度类）。

```tsx
<Input
  type="number"
  min={1}
  value={r.quantity}
  onChange={(e) => setQty(Number(e.target.value))}
  className="w-20 text-right"
/>
<Input type="date" value={nextFollowAt} onChange={/* ... */} min={today()} />
```

**禁忌**
1. 金额输入必须用 `type="number"` 并 `text-right`；禁止用普通文本框自行 parse。
2. 禁止移除 focus 样式（`focus:ring-2`）导致键盘操作不可见。
3. 在 FilterBar 中使用时必须指定宽度，禁止默认 `w-full` 撑爆筛选栏。
4. 密码必须 `type="password"`（NFR-S-03）。

### 5.6 Textarea

**用途**：多行文本输入（备注、跟进内容、审批意见）。

视觉规格：`w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100`。

常用 `rows`：备注 `rows={2~3}`、跟进内容 `rows={2}`、审批意见 `rows={3}`。

```tsx
<Field label="跟进内容" required>
  <Textarea rows={2} value={content} onChange={/* ... */} placeholder="记录了什么？客户反馈了什么？" />
</Field>
```

**禁忌**：禁止给 Multi-line 输入加 `resize-none` 之外的高度锁定；禁止承载超过 500 字的富文本内容。

### 5.7 Select

**用途**：枚举选择（全部的基础字典、状态筛选、归属人、产品选择）。

视觉规格：与 `Input` 相同，额外 `pr-8` 为原生箭头留白。第一个 option 通常为「全部」/「请选择」。

```tsx
<Field label="状态">
  <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
    <option value="">全部</option>
    {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
  </Select>
</Field>
```

**禁忌**
1. 禁止手写 `options` 数组硬编码枚举，必须引用 `businessRules.ts` 的导出常量。
2. 选项超过 15 项时应提供搜索能力；本期字典最大为「所属行业」10 项，暂不需要。
3. 表格内嵌 Select（如报价明细的产品选择）必须指定宽度（`w-56`）避免撑列。

### 5.8 Modal

**用途**：居中模态对话，用于「新建 / 编辑表单、二次确认、审批意见、开票」等需聚焦完成的短任务。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `open` | `boolean` | 必填 | 为 `false` 时 `return null`（不挂载 DOM） |
| `title` | `string` | 必填 | 弹窗标题 |
| `onClose` | `() => void` | 必填 | 关闭回调（点遮罩 / 右上 ✕ 均触发） |
| `children` | `React.ReactNode` | 必填 | 正文 |
| `footer` | `React.ReactNode` | — | 底部按钮区，`flex justify-end gap-2`，存在才渲染 |
| `width` | `string` | `'max-w-2xl'` | 宽度类；常用 `max-w-md`（确认类）、`max-w-lg`、`max-w-xl`（表单）、`max-w-3xl`（报价明细行） |

**视觉规格**：容器 `fixed inset-0 z-50 flex items-center justify-center p-4`；遮罩 `absolute inset-0 bg-ink-900/40`；面板 `relative z-10 w-full rounded-lg bg-white shadow-pop`；头 `flex items-center justify-between border-b border-ink-100 px-5 py-3.5`，标题 `text-base font-semibold text-ink-900`，关闭按钮 `aria-label="关闭"` 的字符 ✕；正文 `max-h-[70vh] overflow-y-auto px-5 py-4`；脚 `border-t px-5 py-3`。

```tsx
<Modal
  open={!!loseTarget}
  title={`废弃线索：${loseTarget?.companyName ?? ''}`}
  onClose={() => setLoseTarget(null)}
  width="max-w-md"
  footer={<>
    <Button onClick={() => setLoseTarget(null)}>取消</Button>
    <Button variant="danger" onClick={doLose}>确认废弃</Button>
  </>}
>
  <Field label="废弃原因" required>{/* ... */}</Field>
</Modal>
```

**禁忌**
1. 主操作按钮固定在 footer 最右侧，取消在其左侧；顺序不得颠倒。
2. 表单类 Modal 禁止超过 12 个字段，超出应改 Drawer 或分步。
3. 禁止在 Modal 中再打开 Modal（层级未做堆叠管理）；二次确认若必须，先关闭前者。
4. 破坏性操作必须配 `danger` variant 并在文案中写明结果（如「确认废弃」而非「确定」）。
5. 校验失败时，错误摘要须置于**正文顶部**（见新建线索的红框模式），不得静默。

### 5.9 Drawer

**用途**：右侧滑出面板，用于**详情查看 + 上下文操作**（线索跟进抽屉、客户 360、商机详情、报价详情、订单详情）。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `open` | `boolean` | 必填 | `false` 时不渲染 |
| `title` | `React.ReactNode` | 必填 | 标题（可为 JSX，如「名称 + 编号」两行） |
| `onClose` | `() => void` | 必填 | 关闭回调 |
| `children` | `React.ReactNode` | 必填 | 正文，`flex-1 overflow-y-auto px-5 py-4` |
| `footer` | `React.ReactNode` | — | 底部操作按钮区（可含多个角色专属按钮） |
| `width` | `string` | `'w-[560px]'` | 常用 `w-[620px]`（商机）、`w-[680px]`（报价/订单）、`w-[720px]`（客户 360） |

**视觉规格**：`fixed inset-0 z-50 flex justify-end`；遮罩 `bg-ink-900/30`；面板 `relative z-10 flex h-full flex-col bg-white shadow-pop`；头脚同 Modal 的 20/14 内边距；正文自适应滚动。

```tsx
<Drawer
  open={!!q}
  width="w-[680px]"
  title={<span>{q.id} <span className="ml-1 text-xs font-normal text-ink-400">{q.customerName}</span></span>}
  onClose={onClose}
  footer={<>
    <Button onClick={onClose}>关闭</Button>
    {myTurn && <><Button variant="success">审批通过</Button><Button variant="danger">驳回</Button></>}
  </>}
>
  {/* KPI 四宫格 + 明细表 + Stepper */}
</Drawer>
```

**禁忌**
1. 「关闭」永远在 footer 最左侧，主操作在右侧；不得省略关闭按钮。
2. Drawer 内的分区标题用 `text-sm font-semibold text-ink-800`，不得使用 Card 包裹再套一层卡片阴影。
3. 禁止把「新建表单」放进 Drawer（新建统一用 Modal）。
4. footer 按钮数量超过 4 个时，需按角色分条件渲染（见报价抽屉），不得全部平铺。

### 5.10 Table / Th / Td

**用途**：列表数据展示。三者必须组合使用。

| 组件 | Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| Table | `head` | `React.ReactNode` | 必填 | 表头内容，通常为 `<><Th>…</Th></>` 片段 |
| Table | `children` | `React.ReactNode` | 必填 | `<tbody>` 内容 |
| Table | `className` | `string` | — | 追加类 |
| Th | `children` | `React.ReactNode` | — | 表头单元格 |
| Th | `className` | `string` | — | 追加类（金额列必须 `text-right`） |
| Td | `children` | `React.ReactNode` | — | 数据单元格 |
| Td | `className` | `string` | — | 追加类（`text-right num`、`max-w-[200px] truncate`、状态色） |
| Td | `colSpan` | `number` | — | 合并列（合计行） |

**视觉规格**：外层 `overflow-x-auto`，`<table className="w-full min-w-[720px] text-sm">`；表头行 `border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold text-ink-600`；`Th` 附加 `whitespace-nowrap px-3 py-2.5 font-semibold`；`tbody` 附加 `divide-y divide-ink-100`；`Td` 附加 `px-3 py-2.5 text-ink-700`；数据行统一 `className="hover:bg-ink-50"`。

```tsx
<Table head={<>
  <Th>报价单号</Th><Th>客户 / 商机</Th>
  <Th className="text-right">报价总额</Th><Th>状态</Th><Th>操作</Th>
</>}>
  {list.map((q) => (
    <tr key={q.id} className="hover:bg-ink-50">
      <Td className="font-medium text-ink-900">{q.id}</Td>
      <Td>{q.customerName}</Td>
      <Td className="text-right num">¥{money(q.totalAmount)}</Td>
      <Td><Badge tone={QUOTATION_STATUS[q.status].tone}>{QUOTATION_STATUS[q.status].label}</Badge></Td>
      <Td><Button size="sm" variant="ghost">详情</Button></Td>
    </tr>
  ))}
</Table>
```

**禁忌**
1. **金额列必须 `className="text-right"`**（通常配 `num`）；金额左对齐视为走查不通过。
2. 禁止在 `Table` 外再包一层 Card 的非 dense 内容区（会双内边距）；列表容器的 Card 必须 `dense`。
3. 行内操作不超过 3 个按钮；超出收敛到详情页 Drawer。
4. 表格必须在 `filtered.length === 0` 时替换为 `EmptyState`，禁止渲染空表头后留白（NFR-U-04）。
5. 表头禁用排序/拖动等未实现能力；本期排序由后端/数据自然顺序决定。

### 5.11 EmptyState

**用途**：列表无数据、无记录的标准空态。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `text` | `string` | `'暂无数据'` | 主文案，应以「没有/暂无 + 对象」句式表达 |
| `hint` | `string` | — | 次级引导文案（`text-xs text-ink-400`），如「调整筛选条件或新建线索」 |

**视觉规格**：`flex flex-col items-center justify-center gap-1 py-14 text-center`；图标为字符 `◻`（`text-3xl text-ink-200`）；文案 `text-sm text-ink-500`。

```tsx
<EmptyState text="没有符合条件的线索" hint="调整筛选条件或新建线索" />
<EmptyState text="暂无跟进记录" />
<EmptyState text="全部回款已完成" />
```

**禁忌**
1. 禁止在空态里放主操作按钮（新建按钮在 PageHeader）；空态只解释 + 引导。
2. 禁止用 Toast 替代空态。
3. 文案必须说明「为什么空」或「下一步怎么办」，不得只写「无数据」。

### 5.12 StatCard

**用途**：顶部关键指标卡，支持可点击下钻。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `label` | `string` | 必填 | 指标名（`text-xs font-medium text-ink-500`） |
| `value` | `React.ReactNode` | 必填 | 指标值（`text-2xl font-semibold tabular-nums text-ink-900`） |
| `sub` | `React.ReactNode` | — | 次级说明（`text-xs text-ink-500`） |
| `tone` | `'primary' \| 'warning' \| 'success' \| 'danger' \| 'info'` | `'primary'` | 仅控制右上角图标底色/文字色 |
| `icon` | `string` | — | 图标字符（◉ ◆ ▦ ◈ ✓ ◷ ! 等） |
| `onClick` | `() => void` | — | 传入即启用 hover 抬升（`hover:border-brand-300 hover:shadow-pop`）与 cursor-pointer |

**视觉规格**：`rounded-lg border border-ink-200 bg-white p-4 shadow-card transition`；图标块 `flex h-7 w-7 items-center justify-center rounded-md text-sm` + tone 配色（`primary: bg-brand-50 text-brand-700` 等）。

```tsx
<StatCard
  label="待跟进线索"
  value={stats.todoLeads}
  sub={`线索池共 ${pool} 条待分配`}
  tone="warning" icon="◉"
  onClick={() => navigate('/leads')}
/>
```

**禁忌**
1. 数值必须走 `moneyShort` / `percent` 格式化，禁止裸 numbers。
2. 禁止同一行 StatCard 混用不同 tone 语义随机配色；配色必须表达业务含义（有逾期=danger，无逾期=success）。
3. 非跳转卡片不要传 `onClick`（避免误导可点击）。
4. 指标卡区建议 4 张一行，最多 5 张。

### 5.13 Tabs

**用途**：同级视图切换（看板/已关闭、全部/待我审批/我创建的、回款计划/回款记录、客户 360 的 5 个标签页）。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `items` | `{ key: string; label: React.ReactNode }[]` | 必填 | 标签项；label 可含计数，如 `` `已关闭 (${closed.length})` `` |
| `active` | `string` | 必填 | 当前激活 key |
| `onChange` | `(k: string) => void` | 必填 | 切换回调 |

**视觉规格**：容器 `flex gap-1 border-b border-ink-200`；项 `px-3.5 py-2 text-sm font-medium transition` + `-mb-px border-b-2`；激活 `border-brand-600 text-brand-700`，未激活 `border-transparent text-ink-500 hover:text-ink-800`。

```tsx
<Tabs
  items={[
    { key: 'all', label: `全部 (${all.length})` },
    { key: 'approval', label: `待我审批 (${myApprovals.length})` },
    { key: 'mine', label: '我创建的' },
  ]}
  active={tab}
  onChange={setTab}
/>
```

**禁忌**
1. 禁止用 Tabs 表达层级/父子关系（那用步骤或面包屑）。
2. 标签数 ≤ 5，超出折叠为 Select。
3. Tabs 放在 FilterBar 时应 `ml-auto` 右对齐；放在 Drawer 正文顶部时独占一行并配 `mt-4` 间距。

### 5.14 Progress

**用途**：回款进度、比例达成可视化。

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `value` | `number` | 必填 | **0~1 的比例值**（组件内部 `×100` 并 clamp 到 0~100） |
| `tone` | `'primary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | 进度条颜色 |
| `showText` | `boolean` | `false` | 右侧显示百分比文本（宽度固定 `w-12` 右对齐） |

**视觉规格**：容器 `flex items-center gap-2`；轨道 `h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100`；条 `h-full rounded-full transition-all` + tone 色（`bg-brand-600` / `bg-emerald-500` / `bg-amber-500` / `bg-rose-500`）。

```tsx
<Progress value={o.amount > 0 ? o.paidAmount / o.amount : 0}
          tone={o.paidAmount >= o.amount ? 'success' : 'primary'} showText />
<Progress value={paid / plan} tone={status === 'OVERDUE' ? 'danger' : 'primary'} />
```

**禁忌**
1. **禁止传 0~100 的整数**（会被 clamp 成 100%）；必须传比率。
2. 必须做除零保护（`planAmount > 0 ? … : 0`）。
3. 表格内使用时应限定列宽（容器 `className="w-36/w-40"`），否则列宽抖动。

### 5.15 Stepper

**用途**：纵向流程时间线，主要用于报价审批链可视化。

| Prop | 类型 | 说明 |
|---|---|---|
| `steps` | `{ title: string; desc?: string; status: 'done' \| 'current' \| 'todo' \| 'reject'; meta?: string }[]` | 步骤列表（必填） |

**视觉规格**：`<ol className="relative ml-1 border-l border-ink-200 pl-5">`；每项 `relative pb-5`（最后一项 `pb-0`）；节点 `absolute -left-[26px] flex h-6 w-6 … rounded-full text-[11px] font-semibold ring-4 ring-white`，按状态取色：`done` emerald-500 / `current` amber-500 / `reject` rose-500 / `todo` ink-200；图标为 ✓ / ✕ / 序号；标题 `text-sm font-medium`，`reject` 时 `text-rose-600`；`desc` 为 `text-xs text-ink-500`，`meta` 为 `text-xs text-ink-400`。

```tsx
<Stepper steps={[
  { title: '创建报价单', desc: `${q.createdByName} · ${q.createdAt}`, status: 'done' },
  ...q.approvalChain.map((s) => ({
    title: `${ROLE_LABEL[s.approverRole]} ${s.approverName}`,
    desc: s.comment || (s.status === 'PENDING' ? '等待处理' : ''),
    status: (s.status === 'APPROVED' ? 'done' : s.status === 'REJECTED' ? 'reject' : 'todo') as const,
    meta: s.at,
  })),
  { title: '生成合同订单', desc: q.status === 'CONVERTED' ? '已完成' : '待操作',
    status: (q.status === 'CONVERTED' ? 'done' : 'todo') as const },
]} />
```

**禁忌**
1. 禁止省略第一步（创建）与最后一步（生成订单），审批链必须闭环。
2. `reject` 出现后，其后步骤状态应保持 `todo`，并需在 `desc` 中给出驳回意见。
3. 禁止用于横向流程展示（组件为纵向实现）。

### 5.16 ToastHost

**用途**：全局轻提示容器，**在整个应用根节点渲染一次**（见 `src/App.tsx`）。

| Prop | 类型 | 说明 |
|---|---|---|
| `items` | `{ id: number; tone: string; message: string }[]` | 当前队列；为空时返回 null |
| `onDismiss` | `(id: number) => void` | 点击任意条目触发移除 |

**视觉规格**：`fixed right-5 top-5 z-[100] flex w-80 flex-col gap-2`；每条 `cursor-pointer rounded-md border px-3.5 py-2.5 text-sm shadow-pop`，按 `tone` 取色：`success` emerald-50/200/800、`error` rose、`warning` amber、`info` sky。

```tsx
<ToastHost items={toasts} onDismiss={dismissToast} />
// 触发方式（页面内）：
const { toast } = useApp();
const r = moveStage(id, to, remark);
if (!r.ok) toast(r.message, 'error');
```

**禁忌**
1. `tone` 只能取上述 4 值之一；传其他值将退化为无配色样式（组件按字符串比较，无兜底分支）。
2. 禁止用 Toast 承载需要用户操作/复制的长信息（如错误堆栈、单号明细）。
3. 同一动作禁止连续触发多条 Toast。
4. 成功提示必须点明结果对象（如「已创建报价单 QT-2026-0011」），不得只说「操作成功」。

### 5.17 PageHeader（布局组件）

| Prop | 类型 | 说明 |
|---|---|---|
| `title` | `string` | 页面标题（`text-lg font-semibold text-ink-900`） |
| `desc` | `string` | 描述（含业务规则口径，如报价页写审批阈值） |
| `actions` | `React.ReactNode` | 右上角操作区 |

视觉规格：`mb-5 flex items-start justify-between`；右侧区 `flex items-center gap-2`。

### 5.18 FilterBar（布局组件）

唯一 Prop：`children`。视觉规格：`mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-ink-200 bg-white p-3`。约定：内部字段用 `Field` 包裹并指定宽度；「重置」按钮紧随其后；右侧切换/统计用 `ml-auto` 推至行尾。

---

## 6. 数据展示规范

### 6.1 金额

| 规则 | 说明 | 实现 |
|---|---|---|
| D-M-01 | 表格金额 **右对齐**，单元格追加 `className="text-right num"` | Tailwind + `.num` 等宽数字 |
| D-M-02 | 千分位分隔，固定 **2 位小数**，前缀 `¥` | `money(v)` → `v.toLocaleString('zh-CN', {min2,max2})` |
| D-M-03 | ≥ 1 万或 ≥ 1 亿使用简写（用于 StatCard、概要、图表轴） | `moneyShort(v)` → `12.3 万` / `1.20 亿` |
| D-M-04 | 明细与表单必须为精确值，禁止简写 | 报价明细、订单金额、回款金额用 `money()` |
| D-M-05 | 计算中间结果四舍五入到分 | `yuan(v) = Math.round(v*100)/100` |
| D-M-06 | 金额为 0 或空一律显示 `¥0.00`，禁止显示 `-` | — |
| D-M-07 | 金额 ≥ 100 万需业务强调（报价页显示“折后金额”加粗 `font-medium`） | — |

```tsx
<Td className="text-right num">¥{money(q.discountAmount)}</Td>   // 表格
<div className="text-base font-semibold num text-brand-700">¥{money(net)}</div> // 详情 KPI
```

### 6.2 日期与时间

| 场景 | 格式 | 示例 |
|---|---|---|
| 所有列表、详情、表单日期框 | `YYYY-MM-DD` | `2026-10-09` |
| 最近动态、审批记录跟进 | `YYYY-MM-DD HH:mm`（来自 `now()`） | `2026-10-09 14:32` |
| 建档/创建时间取日期部分 | `createdAt.slice(0, 10)` | `2026-09-12` |
| 统计月份 | `YYYY-MM` | `2026-09` |

日期比较统一使用字符串比较（`a < b`），并统一由 `today()` 提供基准。禁止在组件内 `new Date()` 自行拼串。

### 6.3 百分比与比率

- 折扣率、赢率、达成率：保留 1 位小数 + `%`，即 `{(rate * 100).toFixed(1)}%`；
- 转化率（漏斗、来源）保留 1 位；阶段赢率整数显示（`10%`、`60%`）；
- `Progress` 的 `value` 传 0~1 比率，展示文本组件自动补 `%`。

### 6.4 敏感信息脱敏

| 场景 | 规则 | 实现 |
|---|---|---|
| 列表中的手机号（线索联系人、客户联系人） | `138****8888`（前 3 + `****` + 后 4） | `maskPhone(p)` |
| 长度 < 7 或空 | 原样返回 / 返回 `-` | `maskPhone` 内处理 |
| 详情抽屉中的线索电话 | **不脱敏**（跟进需要完整号码） | Leads 抽屉显示完整 `lead.phone` |
| 密码输入 | 一律掩码 | `Input type="password"` |

### 6.5 图表

图表组件位于 `src/components/charts`（`FunnelChart` / `LineChart` / `BarRanking` / `PieChart`）。系列色取自 `STAGES[].color`（`#64748b / #0ea5e9 / #8b5cf6 / #f59e0b / #16a34a`）与排行固定序列 `['#2544eb','#0ea5e9','#8b5cf6','#f59e0b']`。图表容器一律放在 `Card` 内，**图表区不得加背景色或网格底色**。

### 6.6 五种状态表现要求

| 状态 | 表现要求 | 项目现状 |
|---|---|---|
| **默认态** | 数据正常渲染，行 hover 反馈 `hover:bg-ink-50` | 已覆盖全部列表 |
| **空态** | 必须使用 `EmptyState`，含主文案 + 可选 hint；禁留白 | 已覆盖（列表、跟进记录、图表无目标数据等） |
| **加载态** | 本期数据为本地内存 + LocalStorage，同步渲染，**无异步等待**，故无全局 Loading；若后续接入 API 需补骨架屏 | 已说明限制 |
| **错误态** | 业务校验失败用 `toast(message,'error')`；表单字段级错误用 `Field error` 或顶部错误摘要块；越权访问显示琥珀色提示卡「权限不足：当前角色（XX）无权访问该模块」 | 已覆盖 |
| **禁用态** | 按钮 `disabled` → `opacity-50 cursor-not-allowed`；不可选复选框 `disabled`；过期报价禁用「提交审批」「生成订单」 | 已覆盖 |

---

## 7. 交互规范

### 7.1 按钮可用性与显隐条件

| 场景 | 规则 |
|---|---|
| 新建商机「创建」 | `disabled={!f.title.trim() || !f.customerId}` |
| 保存跟进 | `disabled={!content.trim()}`（跟进内容必填） |
| 提交审批 | 仅创建人可见且状态为 `DRAFT`/`REJECTED`；报价过期时 `disabled` |
| 审批通过/驳回 | 仅当审批链中 `approverId === user.id && step === currentStep && status === 'PENDING'` 时渲染 |
| 生成合同订单 | 仅当 `status === 'APPROVED' && !expired` 时渲染 |
| 商务审核通过/驳回 | 仅 `FINANCE` 角色 + 订单 `PENDING` |
| 订单推进（开始交付/交付完成） | 非财务角色可见并可点；财务点击提示「订单交付状态由销售或项目经理推进」 |
| 登记回款 | 仅当 `planAmount - paidAmount > 0`，否则显示「已完成」文本 |
| 确认到账 | 仅 `FINANCE` + 回款 `REGISTERED` |
| 开票 | 仅 `FINANCE` + 回款 `CONFIRMED` + `invoiceStatus === 'NONE'` |
| 明细行删除 | `disabled={rows.length === 1}`（至少保留一行） |
| 标记赢单 | 仅当存在已签约订单（`signedOrder`）时出现 |

### 7.2 破坏性操作二次确认

下列操作**必须**先弹 Modal 确认，并在确认按钮上写明动作结果：

| 操作 | 确认方式 | 必填信息 |
|---|---|---|
| 线索废弃 | Modal + `danger` 按钮「确认废弃」 | 废弃原因（枚举，必选） |
| 商机输单 | Modal + `danger`「确认」 | 输单原因（必选）+ 竞品（选填） |
| 商机赢单 | Modal + `success`「确认」 | 实际成交金额（必填） |
| 报价驳回 | Modal + `danger`「确认」 | 审批意见（**必填**） |
| 商务审核驳回 | Modal + `danger`「确认」 | 审核意见（必填） |
| 客户转移 | Drawer 内选择新归属 + 「确认转移」 | 新归属销售（必选）+ 是否同步转移商机 |
| 客户等级人工覆盖 | 点击「设为 X 级」即时生效 + 提供「恢复自动评定」 | 界面标注「（已被人工覆盖）」 |
| 线索转化 | Modal「确认转化」+ 前置说明不可回退 | 可选同步创建商机 |

### 7.3 Toast 提示时机

| 触发 | tone | 文案要求 |
|---|---|---|
| 业务操作成功（由 action 内部统一触发） | `success` | 点明对象与结果，如「已将 3 条线索分配给 张伟」 |
| 登录成功 | `success` | 「登录成功，欢迎回来」 |
| 业务规则拦截失败（返回 `{ok:false,message}`） | `error` | 直接展示 `message`，说明具体原因，如「未满足进入『方案报价』的前置条件：需至少创建 1 张报价单」 |
| 表单必填缺失 | — | 不使用 Toast，改用顶部错误摘要块 + 字段红字 |
| 无权限操作（如财务点交付推进） | `info` | 「订单交付状态由销售或项目经理推进」 |
| 越权访问路由 | — | 不使用 Toast，页面内琥珀提示卡 |

### 7.4 表单校验时机与错误定位

1. **校验时机**：统一在「提交时」校验（`submit()` 内），不做实时 onBlur 校验，避免输入过程中频繁报错。
2. **字段级错误**：用 `Field error` 精确定位到字段下方（登录密码错误即此模式）。
3. **表单级摘要**：多字段缺失时在 Modal 正文顶部显示红色信息条 —— `请完善必填项：公司名称、联系电话（7-15 位数字）`，同时字段标签已标 `*`。
4. **即时禁用优先**：能预判的单字段条件（标题为空、内容为空、未选客户、只剩一行）直接禁用按钮，不报错。
5. **业务侧校验**（阶段前置条件、回款超额、重单冲突）：在抽屉/弹窗内以提示块提前告知（如商机详情的琥珀前置条件提示、商机撞单警告），提交后再由 action 返回错误 Toast。
6. **回车提交**：登录页两个输入框支持 `Enter` 提交；其余表单不强制。

### 7.5 必填标识

- 视觉：`<Field required>` → 标签后 `*` 红色；
- 提示：`hint` 中补充口径（如「7-15 位数字」「不得超过剩余未回款金额（BR-06）」）；
- 数量：单表单必填项 ≤ 6 个，超出的非核心字段设为选填并给出默认值。

---

## 8. 可访问性与一致性检查清单

### 8.1 一致性检查清单（UI 走查逐页核对）

| # | 检查项 | 判据 |
|---|---|---|
| 1 | 页面结构 | 是否遵循 PageHeader → 概览卡 → FilterBar → 内容卡 |
| 2 | 主操作位置 | 「+ 新建 X」是否唯一位于 PageHeader 右侧 `variant="primary"` |
| 3 | 金额格式 | 是否全部 `text-right num` + `¥` + 千分位 2 位 |
| 4 | 日期格式 | 是否全部 `YYYY-MM-DD`（含 `<input type="date">` 回显） |
| 5 | 状态标记 | 是否全部来自 `businessRules` 字典 + `Badge`，无自定义色 |
| 6 | 文案一致 | 同一业务对象文案是否全局一致（如「审批中」不得在个别页写成「待我方审批」） |
| 7 | 空态覆盖 | 每个列表/detailList 是否都有 `EmptyState` |
| 8 | 按钮语义 | 破坏性是否 `danger`、通过类是否 `success`、主操作是否唯一 primary |
| 9 | 图标 | 是否只使用规定的字符图标集合（◉ ◆ ▦ ◈ ✓ ◷ ! ▣ ▤ ▩ ◐ ⚙ →） |
| 10 | 间距 | 是否只用 4 的倍数；区块间距 20px、卡片 padding 16px |
| 11 | 圆角/阴影 | 是否按 3.4.2 / 3.5 取值，无自定义数值 |
| 12 | Toast | 是否存在未点明对象的成功/失败提示 |
| 13 | 数据权限 | 列表是否经 `visibleXxx(db, user)` 过滤，无越权数据泄漏 |
| 14 | 中文文案 | 是否无中英混排怪异断句、无未翻译英文（技术术语除外） |
| 15 | 与实现一致 | 文档示例中的 Props 是否与 `ui/index.tsx` 一致（每次组件变更后复审） |

### 8.2 可访问性清单

| # | 检查项 | 现状 |
|---|---|---|
| A-01 | 表单控件均有可见 `<label>` 关联（`Field` 用 `<label>` 包裹，属隐式关联） | ✅ 已满足 |
| A-02 | 图标按钮提供 `aria-label`（Modal / Drawer 关闭按钮已有 `aria-label="关闭"`） | ✅ 已满足 |
| A-03 | 键盘可聚焦并有可见焦点环（Input/Select/Textarea 均有 `focus:ring-2 focus:ring-brand-100`） | ✅ 已满足 |
| A-04 | 登录支持回车提交 | ✅ 已满足 |
| A-05 | 颜色不作为唯一信息载体（Badge 均带文字；逾期同时有色 + 「已逾期」字） | ✅ 已满足 |
| A-06 | 正文对比度 ≥ 4.5:1（`ink-700` 以上正文、`ink-400` 仅用于非关键信息） | ✅ 已满足 |
| A-07 | 表格 `<th>` 未标注 `scope` 属性 | ⚠ 已知改进项 |
| A-08 | Modal / Drawer 未实现焦点陷阱（Focus Trap）与打开时焦点自动移入 | ⚠ 已知改进项 |
| A-09 | Modal / Drawer 未监听 `Esc` 键关闭 | ⚠ 已知改进项（关闭方式为 ✕ / 遮罩点击） |
| A-10 | `Stepper` 未提供 `aria-current="step"` 语义 | ⚠ 已知改进项 |
| A-11 | 拖拽看板未提供键盘替代操作（阶段按钮存在于详情抽屉，可作为替代路径） | ⚠ 部分满足 |
| A-12 | Toast 未设置 `role="status"` / `aria-live` | ⚠ 已知改进项 |

> A-07 ~ A-12 为 v1.0 已知限制，已在《详细设计说明书》登记为 v1.1 改进项；不阻塞本次验收。

### 8.3 组件变更规则

1. 新增/修改基础组件必须同步更新本文档第 5 章的 Props 表与代码示例；
2. 新增 tone / variant 必须先在 `businessRules.ts` 或组件库注册，禁止页面里临时 `className` 拼色；
3. 组件 API 变更须同步修订《详细设计说明书》组件清单。

---

## 附录 A：组件 → 源文件 → 使用页面对照

| 组件 | 源文件 | 主要使用页面 |
|---|---|---|
| Card / Table / Th / Td / EmptyState / Badge / Button | `src/components/ui/index.tsx` | P02 ~ P10 全部 |
| Field / Input / Select / Textarea | 同上 | 各页 FilterBar、Modal 表单、Drawer 表单 |
| Modal | 同上 | P03（新建线索/转化/废弃）、P05（新建商机/关闭）、P06（审批意见/新建报价）、P07（生成订单/商务审核）、P08（登记回款/开票） |
| Drawer | 同上 | P03 跟进、P04 客户 360、P05 商机详情、P06 报价详情、P07 订单详情 |
| StatCard | 同上 | P02 工作台、P08 回款管理 |
| Tabs | 同上 | P04 客户 360、P05 看板/已关闭、P06 全部/待我审批/我创建的、P08 计划/记录 |
| Progress | 同上 | P02 回款进度概览、P07 订单列表与详情、P08 回款计划、P04 订单标签页 |
| Stepper | 同上 | P06 报价详情审批链 |
| ToastHost | 同上（挂载于 `src/App.tsx`） | 全局 |
| PageHeader / FilterBar / Layout | `src/components/Layout.tsx` | 全部内页 |
| FunnelChart / LineChart / BarRanking / PieChart | `src/components/charts` | P02、P03、P09 |

---

**文档结束。** 本文所有色值、类名、Props 均以 `app/tailwind.config.js`、`app/src/components/ui/index.tsx`、`app/src/components/Layout.tsx` 当前版本为准，代码变更时应同步修订本文档。
