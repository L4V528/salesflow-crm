/**
 * 演示数据种子
 * 设计依据：《数据库设计说明书》第 7 章 演示数据设计
 * 原则：覆盖全状态机分支、含异常场景、时间跨 6 个月、金额有梯度
 */

import type {
  Database, User, Lead, FollowUp, Customer, Contact, Opportunity, StageHistory,
  Product, Quotation, QuotationItem, ApprovalRecord, Order, PaymentPlan, Payment,
  Target, ActivityLog, Role,
} from '@/types';
import { DB_VERSION } from '@/lib/storage';
import { yuan, addDays, today, now } from '@/lib/format';
import { STAGE_MAP } from '@/config/businessRules';

const TODAY = today();

/* ==================== 用户 ==================== */

function mkUser(
  id: string, username: string, name: string, role: Role, title: string, dept: string, phone: string,
): User {
  return {
    id, username, password: '123456', name, role, title, dept, phone,
    avatar: name.slice(0, 1), status: 'ACTIVE', createdAt: '2026-04-01 09:00',
  };
}

const users: User[] = [
  mkUser('U001', 'zhangwei', '张伟', 'SALES', '销售专员', '华东销售一部', '13812345678'),
  mkUser('U002', 'lina', '李娜', 'MANAGER', '销售经理', '华东销售一部', '13912345678'),
  mkUser('U003', 'wangfang', '王芳', 'FINANCE', '商务财务专员', '商务部', '13712345678'),
  mkUser('U004', 'zhaoqiang', '赵强', 'ADMIN', '系统管理员', '信息技术部', '13612345678'),
  mkUser('U005', 'chenjing', '陈静', 'SALES', '高级销售专员', '华东销售一部', '13512345678'),
  mkUser('U006', 'liuyang', '刘洋', 'SALES', '销售专员', '华南销售二部', '13412345678'),
  mkUser('U007', 'sunlei', '孙磊', 'MANAGER', '销售总监', '销售管理部', '13312345678'),
  mkUser('U008', 'zhoumin', '周敏', 'FINANCE', '财务主管', '商务部', '13212345678'),
];

const uName = (id: string) => users.find((u) => u.id === id)?.name ?? '';

/* ==================== 产品 ==================== */

const products: Product[] = [
  { id: 'P001', name: 'SalesFlow CRM 标准版', spec: 'V5.0 / 50 用户', unit: '套', price: 38000, category: '软件许可', status: 'ON_SALE' },
  { id: 'P002', name: 'SalesFlow CRM 企业版', spec: 'V5.0 / 不限用户', unit: '套', price: 88000, category: '软件许可', status: 'ON_SALE' },
  { id: 'P003', name: '数据集成中间件', spec: 'ESB-2000', unit: '套', price: 45000, category: '平台组件', status: 'ON_SALE' },
  { id: 'P004', name: '移动端应用授权', spec: 'iOS/Android', unit: '年', price: 18000, category: '软件许可', status: 'ON_SALE' },
  { id: 'P005', name: 'BI 智能分析模块', spec: 'BI-Pro', unit: '套', price: 62000, category: '平台组件', status: 'ON_SALE' },
  { id: 'P006', name: '实施部署服务', spec: '标准实施包', unit: '次', price: 25000, category: '专业服务', status: 'ON_SALE' },
  { id: 'P007', name: '定制开发服务', spec: '资深工程师', unit: '人天', price: 2000, category: '专业服务', status: 'ON_SALE' },
  { id: 'P008', name: '年度运维服务', spec: '7×24 响应', unit: '年', price: 36000, category: '专业服务', status: 'ON_SALE' },
  { id: 'P009', name: '物联网网关设备', spec: 'GT-800', unit: '台', price: 12800, category: '硬件', status: 'ON_SALE' },
  { id: 'P010', name: '用户培训服务', spec: '现场 2 天', unit: '次', price: 8000, category: '专业服务', status: 'ON_SALE' },
  { id: 'P011', name: '历史数据迁移服务', spec: '含清洗校验', unit: '次', price: 15000, category: '专业服务', status: 'ON_SALE' },
  { id: 'P012', name: '开放平台 API 授权', spec: '500 万次/年', unit: '年', price: 22000, category: '软件许可', status: 'OFF_SALE' },
];

const pMap = Object.fromEntries(products.map((p) => [p.id, p]));

/* ==================== 客户 ==================== */

interface CustSeed { id: string; name: string; industry: string; level: 'A' | 'B' | 'C'; owner: string; total: number; createdAt: string; lead?: string }

const custSeeds: CustSeed[] = [
  { id: 'C20260001', name: '华远科技有限公司', industry: '制造业', level: 'A', owner: 'U001', total: 964000, createdAt: '2026-04-12', lead: 'L20260003' },
  { id: 'C20260002', name: '明德医疗器械股份公司', industry: '医疗健康', level: 'A', owner: 'U005', total: 720000, createdAt: '2026-04-20', lead: 'L20260005' },
  { id: 'C20260003', name: '速达物流集团有限公司', industry: '物流运输', level: 'B', owner: 'U006', total: 285000, createdAt: '2026-05-08', lead: 'L20260008' },
  { id: 'C20260004', name: '星海教育科技有限公司', industry: '教育培训', level: 'B', owner: 'U001', total: 156000, createdAt: '2026-05-19', lead: 'L20260011' },
  { id: 'C20260005', name: '中鼎重工机械有限公司', industry: '制造业', level: 'A', owner: 'U005', total: 1480000, createdAt: '2026-03-25', lead: 'L20260001' },
  { id: 'C20260006', name: '云图信息技术有限公司', industry: '信息技术', level: 'B', owner: 'U006', total: 320000, createdAt: '2026-06-02', lead: 'L20260013' },
  { id: 'C20260007', name: '恒信金融信息服务公司', industry: '金融保险', level: 'C', owner: 'U001', total: 88000, createdAt: '2026-06-15', lead: 'L20260015' },
  { id: 'C20260008', name: '绿源新能源科技有限公司', industry: '能源电力', level: 'B', owner: 'U005', total: 190000, createdAt: '2026-07-03', lead: 'L20260017' },
  { id: 'C20260009', name: '泰和建筑集团股份有限公司', industry: '建筑工程', level: 'A', owner: 'U006', total: 2050000, createdAt: '2026-03-18', lead: 'L20260002' },
  { id: 'C20260010', name: '优鲜零售连锁有限公司', industry: '零售快消', level: 'C', owner: 'U001', total: 45000, createdAt: '2026-07-22', lead: 'L20260019' },
  { id: 'C20260011', name: '智联通信设备制造公司', industry: '信息技术', level: 'B', owner: 'U005', total: 410000, createdAt: '2026-08-05', lead: 'L20260021' },
  { id: 'C20260012', name: '瑞康生物制药有限公司', industry: '医疗健康', level: 'C', owner: 'U006', total: 62000, createdAt: '2026-08-28', lead: 'L20260023' },
];

const customers: Customer[] = custSeeds.map((c) => ({
  id: c.id, name: c.name, industry: c.industry, level: c.level, levelAuto: true,
  source: '线索转化', ownerId: c.owner, ownerName: uName(c.owner),
  address: `${['上海市', '北京市', '深圳市', '杭州市', '成都市'][Number(c.id.slice(-1)) % 5]}高新技术产业园区`,
  website: `www.${c.id.toLowerCase()}.example.com`,
  totalAmount: c.total, createdAt: c.createdAt, leadId: c.lead,
}));

const cName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

/* ==================== 联系人 ==================== */

interface ContactSeed { cust: string; name: string; title: string; phone: string; email: string; primary?: boolean }

const contactSeeds: ContactSeed[] = [
  { cust: 'C20260001', name: '周建国', title: '信息总监', phone: '13800010001', email: 'zhoujg@huayuan.example.com', primary: true },
  { cust: 'C20260001', name: '吴敏', title: '采购经理', phone: '13800010002', email: 'wumin@huayuan.example.com' },
  { cust: 'C20260002', name: '郑立群', title: '副院长', phone: '13800020001', email: 'zhenglq@mingde.example.com', primary: true },
  { cust: 'C20260002', name: '何静', title: '设备科长', phone: '13800020002', email: 'hejing@mingde.example.com' },
  { cust: 'C20260003', name: '马文涛', title: '运营副总', phone: '13800030001', email: 'mawentao@suda.example.com', primary: true },
  { cust: 'C20260004', name: '许海燕', title: '技术负责人', phone: '13800040001', email: 'xuhy@xinghai.example.com', primary: true },
  { cust: 'C20260004', name: '范强', title: '产品经理', phone: '13800040002', email: 'fanqiang@xinghai.example.com' },
  { cust: 'C20260005', name: '罗天成', title: '总经理', phone: '13800050001', email: 'luotc@zhongding.example.com', primary: true },
  { cust: 'C20260005', name: '谢国栋', title: '信息化部长', phone: '13800050002', email: 'xiegd@zhongding.example.com' },
  { cust: 'C20260006', name: '蒋雨薇', title: 'CTO', phone: '13800060001', email: 'jiangyw@yuntu.example.com', primary: true },
  { cust: 'C20260007', name: '沈志远', title: '风控负责人', phone: '13800070001', email: 'shenzy@hengxin.example.com', primary: true },
  { cust: 'C20260008', name: '崔明', title: '运维总监', phone: '13800080001', email: 'cuiming@lvyuan.example.com', primary: true },
  { cust: 'C20260008', name: '田蕾', title: '项目工程师', phone: '13800080002', email: 'tianlei@lvyuan.example.com' },
  { cust: 'C20260009', name: '黄志强', title: '集团副总', phone: '13800090001', email: 'huangzq@taihe.example.com', primary: true },
  { cust: 'C20260009', name: '林芳华', title: '数字化中心主任', phone: '13800090002', email: 'linfh@taihe.example.com' },
  { cust: 'C20260010', name: '杜鹏', title: 'IT 经理', phone: '13800100001', email: 'dupeng@youxian.example.com', primary: true },
  { cust: 'C20260011', name: '袁伟', title: '研发总监', phone: '13800110001', email: 'yuanwei@zhilian.example.com', primary: true },
  { cust: 'C20260011', name: '钱丽', title: '采购主管', phone: '13800110002', email: 'qianli@zhilian.example.com' },
  { cust: 'C20260012', name: '龚学明', title: '质量总监', phone: '13800120001', email: 'gongxm@ruikang.example.com', primary: true },
  { cust: 'C20260012', name: '邵丹', title: '实验室主管', phone: '13800120002', email: 'shaodan@ruikang.example.com' },
];

const contacts: Contact[] = contactSeeds.map((s, i) => ({
  id: `CT${String(i + 1).padStart(4, '0')}`,
  customerId: s.cust, name: s.name, title: s.title, phone: s.phone, email: s.email, isPrimary: !!s.primary,
}));

/* ==================== 商机 ==================== */

interface OppSeed {
  id: string; title: string; cust: string; amount: number; stage: 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
  owner: string; status: 'OPEN' | 'WON' | 'LOST'; closeDate: string; createdAt: string;
  source: string; lostReason?: string; competitor?: string; actual?: number;
}

const oppSeeds: OppSeed[] = [
  { id: 'O20260001', title: '智能工厂 MES 系统集成', cust: 'C20260001', amount: 1200000, stage: 'S4', owner: 'U001', status: 'OPEN', closeDate: '2026-11-30', createdAt: '2026-06-10', source: '客户转介绍' },
  { id: 'O20260002', title: '数字化手术室整体方案', cust: 'C20260002', amount: 1800000, stage: 'S3', owner: 'U005', status: 'OPEN', closeDate: '2026-12-15', createdAt: '2026-07-01', source: '展会名录' },
  { id: 'O20260003', title: '仓储管理系统升级改造', cust: 'C20260003', amount: 650000, stage: 'S2', owner: 'U006', status: 'OPEN', closeDate: '2026-12-20', createdAt: '2026-07-18', source: '官网表单' },
  { id: 'O20260004', title: '在线学习平台建设项目', cust: 'C20260004', amount: 480000, stage: 'S3', owner: 'U001', status: 'OPEN', closeDate: '2026-11-15', createdAt: '2026-07-25', source: '广告投放' },
  { id: 'O20260005', title: '设备物联网监控平台', cust: 'C20260005', amount: 1560000, stage: 'S5', owner: 'U005', status: 'WON', closeDate: '2026-09-30', createdAt: '2026-04-05', source: '客户转介绍', actual: 1480000 },
  { id: 'O20260006', title: '客户数据平台一期', cust: 'C20260006', amount: 320000, stage: 'S1', owner: 'U006', status: 'OPEN', closeDate: '2027-01-31', createdAt: '2026-09-02', source: '官网表单' },
  { id: 'O20260007', title: '智能风控系统建设', cust: 'C20260007', amount: 880000, stage: 'S2', owner: 'U001', status: 'OPEN', closeDate: '2026-12-31', createdAt: '2026-08-12', source: '电话咨询' },
  { id: 'O20260008', title: '光伏电站运维管理平台', cust: 'C20260008', amount: 760000, stage: 'S4', owner: 'U005', status: 'OPEN', closeDate: '2026-11-20', createdAt: '2026-07-28', source: '展会名录' },
  { id: 'O20260009', title: '智慧工地一体化平台', cust: 'C20260009', amount: 2100000, stage: 'S5', owner: 'U006', status: 'WON', closeDate: '2026-08-31', createdAt: '2026-03-20', source: '客户转介绍', actual: 2050000 },
  { id: 'O20260010', title: '门店 POS 系统升级', cust: 'C20260010', amount: 180000, stage: 'S1', owner: 'U001', status: 'OPEN', closeDate: '2027-02-28', createdAt: '2026-09-15', source: '官网表单' },
  { id: 'O20260011', title: '5G 基站智能监控项目', cust: 'C20260011', amount: 950000, stage: 'S3', owner: 'U005', status: 'OPEN', closeDate: '2026-12-10', createdAt: '2026-08-20', source: '客户转介绍' },
  { id: 'O20260012', title: '实验室 LIMS 系统采购', cust: 'C20260012', amount: 420000, stage: 'S2', owner: 'U006', status: 'OPEN', closeDate: '2027-01-15', createdAt: '2026-09-05', source: '电话咨询' },
  { id: 'O20260013', title: '设备联网二期扩展', cust: 'C20260005', amount: 580000, stage: 'S2', owner: 'U005', status: 'OPEN', closeDate: '2027-03-31', createdAt: '2026-10-02', source: '老客户增购' },
  { id: 'O20260014', title: '数据仓库建设项目', cust: 'C20260007', amount: 600000, stage: 'S2', owner: 'U001', status: 'LOST', closeDate: '2026-09-10', createdAt: '2026-06-20', source: '展会名录', lostReason: '竞品胜出', competitor: '某友数据中台' },
  { id: 'O20260015', title: '车队管理系统采购', cust: 'C20260003', amount: 450000, stage: 'S3', owner: 'U006', status: 'LOST', closeDate: '2026-08-25', createdAt: '2026-05-30', source: '官网表单', lostReason: '无预算' },
];

const opportunities: Opportunity[] = oppSeeds.map((o) => ({
  id: o.id, title: o.title, customerId: o.cust, customerName: cName(o.cust), amount: o.amount,
  stage: o.stage, probability: STAGE_MAP[o.stage].probability,
  expectedCloseDate: o.closeDate, ownerId: o.owner, ownerName: uName(o.owner),
  source: o.source, status: o.status, lostReason: o.lostReason, competitor: o.competitor,
  actualAmount: o.actual, closedAt: o.status === 'OPEN' ? undefined : o.closeDate,
  createdAt: o.createdAt, remark: o.status === 'WON' ? '客户对我方实施能力认可，已签署验收报告' : undefined,
}));

/* ==================== 商机阶段历史 ==================== */

const stageHistories: StageHistory[] = [];
let shIdx = 1;
const shAdd = (oppId: string, from: string | undefined, to: string, op: string, at: string, remark: string) => {
  stageHistories.push({
    id: `SH${String(shIdx++).padStart(4, '0')}`, opportunityId: oppId,
    fromStage: from as StageHistory['fromStage'], toStage: to as StageHistory['toStage'],
    operatorId: op, operatorName: uName(op), remark, createdAt: at,
  });
};

const stagePath: Record<string, { opp: string; path: string[]; owner: string; start: string }> = {
  O20260001: { opp: 'O20260001', path: ['S1', 'S2', 'S3', 'S4'], owner: 'U001', start: '2026-06-10' },
  O20260002: { opp: 'O20260002', path: ['S1', 'S2', 'S3'], owner: 'U005', start: '2026-07-01' },
  O20260003: { opp: 'O20260003', path: ['S1', 'S2'], owner: 'U006', start: '2026-07-18' },
  O20260004: { opp: 'O20260004', path: ['S1', 'S2', 'S3'], owner: 'U001', start: '2026-07-25' },
  O20260005: { opp: 'O20260005', path: ['S1', 'S2', 'S3', 'S4', 'S5'], owner: 'U005', start: '2026-04-05' },
  O20260007: { opp: 'O20260007', path: ['S1', 'S2'], owner: 'U001', start: '2026-08-12' },
  O20260008: { opp: 'O20260008', path: ['S1', 'S2', 'S3', 'S4'], owner: 'U005', start: '2026-07-28' },
  O20260009: { opp: 'O20260009', path: ['S1', 'S2', 'S3', 'S4', 'S5'], owner: 'U006', start: '2026-03-20' },
  O20260011: { opp: 'O20260011', path: ['S1', 'S2', 'S3'], owner: 'U005', start: '2026-08-20' },
  O20260012: { opp: 'O20260012', path: ['S1', 'S2'], owner: 'U006', start: '2026-09-05' },
  O20260013: { opp: 'O20260013', path: ['S1', 'S2'], owner: 'U005', start: '2026-10-02' },
  O20260015: { opp: 'O20260015', path: ['S1', 'S2', 'S3'], owner: 'U006', start: '2026-05-30' },
  O20260006: { opp: 'O20260006', path: ['S1'], owner: 'U006', start: '2026-09-02' },
  O20260010: { opp: 'O20260010', path: ['S1'], owner: 'U001', start: '2026-09-15' },
  O20260014: { opp: 'O20260014', path: ['S1', 'S2'], owner: 'U001', start: '2026-06-20' },
};

const stageRemarks: Record<string, string> = {
  S1: '完成首次电话接触，确认客户基本信息与预算范围',
  S2: '完成现场调研，需求要点已记录在案',
  S3: '已出具正式报价方案并提交客户',
  S4: '报价已通过内部审批，进入商务条款谈判',
  S5: '合同已签订，商机赢单',
};

for (const [oppId, cfg] of Object.entries(stagePath)) {
  cfg.path.forEach((st, i) => {
    const at = addDays(cfg.start, i * 12);
    shAdd(oppId, i === 0 ? undefined : cfg.path[i - 1], st, cfg.owner, `${at} 10:30`, stageRemarks[st] ?? '');
  });
}

/* ==================== 报价单 ==================== */

interface ItemSeed { product: string; qty: number; discount: number }
interface QuoteSeed {
  id: string; opp: string; status: Quotation['status']; items: ItemSeed[];
  validUntil: string; createdBy: string; createdAt: string; payMethod: string; remark: string;
  /** 审批链：[审批人ID, 动作] */
  approvals?: { approver: string; action: 'APPROVED' | 'REJECTED'; comment: string; at: string }[];
}

const quoteSeeds: QuoteSeed[] = [
  {
    id: 'Q20260001', opp: 'O20260001', status: 'APPROVED', payMethod: '三三四',
    items: [{ product: 'P002', qty: 6, discount: 0.18 }, { product: 'P003', qty: 2, discount: 0.18 }, { product: 'P006', qty: 4, discount: 0.18 }, { product: 'P007', qty: 120, discount: 0.18 }],
    validUntil: addDays(TODAY, 25), createdBy: 'U001', createdAt: '2026-09-12 14:20',
    remark: '客户要求含三年运维，报价中含实施与定制开发人天',
    approvals: [{ approver: 'U002', action: 'APPROVED', comment: '折扣在授权范围内，客户为战略客户，同意', at: '2026-09-13 09:15' }],
  },
  {
    id: 'Q20260002', opp: 'O20260002', status: 'APPROVING', payMethod: '三三四',
    items: [{ product: 'P002', qty: 12, discount: 0.32 }, { product: 'P005', qty: 4, discount: 0.32 }, { product: 'P009', qty: 30, discount: 0.32 }, { product: 'P006', qty: 6, discount: 0.32 }, { product: 'P008', qty: 12, discount: 0.32 }],
    validUntil: addDays(TODAY, 20), createdBy: 'U005', createdAt: '2026-10-06 16:40',
    remark: '医疗行业标杆项目，客户承诺后续二期，申请较高折扣',
    approvals: [],
  },
  {
    id: 'Q20260003', opp: 'O20260004', status: 'APPROVED', payMethod: '全额预付',
    items: [{ product: 'P001', qty: 8, discount: 0.08 }, { product: 'P004', qty: 8, discount: 0.08 }, { product: 'P010', qty: 3, discount: 0.08 }],
    validUntil: addDays(TODAY, 30), createdBy: 'U001', createdAt: '2026-09-28 11:05',
    remark: '教育行业标准方案，折扣低于阈值无需审批',
    approvals: [],
  },
  {
    id: 'Q20260004', opp: 'O20260008', status: 'APPROVED', payMethod: '验收后付',
    items: [{ product: 'P002', qty: 5, discount: 0.22 }, { product: 'P005', qty: 2, discount: 0.22 }, { product: 'P009', qty: 18, discount: 0.22 }, { product: 'P006', qty: 3, discount: 0.22 }],
    validUntil: addDays(TODAY, 18), createdBy: 'U005', createdAt: '2026-09-20 15:30',
    remark: '新能源行业首单，含网关硬件',
    approvals: [{ approver: 'U002', action: 'APPROVED', comment: '同意，硬件部分毛利较高可让利软件', at: '2026-09-21 10:02' }],
  },
  {
    id: 'Q20260005', opp: 'O20260011', status: 'REJECTED', payMethod: '三三四',
    items: [{ product: 'P002', qty: 8, discount: 0.35 }, { product: 'P003', qty: 4, discount: 0.35 }, { product: 'P007', qty: 200, discount: 0.35 }],
    validUntil: addDays(TODAY, 12), createdBy: 'U005', createdAt: '2026-09-25 09:50',
    remark: '客户端压价严重，申请 35% 折扣',
    approvals: [{ approver: 'U002', action: 'REJECTED', comment: '折扣超出授权范围，且定制人天数偏高，请重新核算后提交', at: '2026-09-26 14:22' }],
  },
  {
    id: 'Q20260006', opp: 'O20260005', status: 'CONVERTED', payMethod: '三三四',
    items: [{ product: 'P002', qty: 10, discount: 0.2 }, { product: 'P003', qty: 3, discount: 0.2 }, { product: 'P009', qty: 45, discount: 0.2 }, { product: 'P006', qty: 5, discount: 0.2 }],
    validUntil: '2026-08-30', createdBy: 'U005', createdAt: '2026-06-15 10:00',
    remark: '中鼎重工一期项目，已转正式订单',
    approvals: [{ approver: 'U002', action: 'APPROVED', comment: '同意', at: '2026-06-16 09:00' }],
  },
  {
    id: 'Q20260007', opp: 'O20260009', status: 'CONVERTED', payMethod: '三三四',
    items: [{ product: 'P002', qty: 15, discount: 0.08 }, { product: 'P003', qty: 5, discount: 0.08 }, { product: 'P005', qty: 3, discount: 0.08 }, { product: 'P006', qty: 8, discount: 0.08 }, { product: 'P011', qty: 2, discount: 0.08 }],
    validUntil: '2026-07-31', createdBy: 'U006', createdAt: '2026-05-10 09:30',
    remark: '集团级项目，金额超百万触发两级审批',
    approvals: [
      { approver: 'U002', action: 'APPROVED', comment: '金额较大但折扣可控，同意上报总监', at: '2026-05-11 10:00' },
      { approver: 'U007', action: 'APPROVED', comment: '战略客户，同意本报价', at: '2026-05-12 15:30' },
    ],
  },
  {
    id: 'Q20260008', opp: 'O20260007', status: 'DRAFT', payMethod: '三三四',
    items: [{ product: 'P002', qty: 6, discount: 0.25 }, { product: 'P005', qty: 2, discount: 0.25 }, { product: 'P008', qty: 6, discount: 0.25 }],
    validUntil: addDays(TODAY, 45), createdBy: 'U001', createdAt: '2026-10-08 17:10',
    remark: '金融行业合规要求高，待补充安全模块报价',
  },
  {
    id: 'Q20260009', opp: 'O20260003', status: 'DRAFT', payMethod: '验收后付',
    items: [{ product: 'P001', qty: 10, discount: 0.05 }, { product: 'P004', qty: 10, discount: 0.05 }, { product: 'P011', qty: 1, discount: 0.05 }],
    validUntil: addDays(TODAY, 40), createdBy: 'U006', createdAt: '2026-10-07 14:00',
    remark: '客户要求含历史数据迁移',
  },
  {
    id: 'Q20260010', opp: 'O20260012', status: 'EXPIRED', payMethod: '全额预付',
    items: [{ product: 'P001', qty: 6, discount: 0.16 }, { product: 'P010', qty: 2, discount: 0.16 }],
    validUntil: addDays(TODAY, -12), createdBy: 'U006', createdAt: '2026-08-10 09:20',
    remark: '客户内部立项延迟，报价已过期需重新出具',
  },
];

const quotations: Quotation[] = [];
const quotationItems: QuotationItem[] = [];
const approvalRecords: ApprovalRecord[] = [];
let itemIdx = 1;
let arIdx = 1;

for (const qs of quoteSeeds) {
  const opp = opportunities.find((o) => o.id === qs.opp)!;
  let total = 0;
  let net = 0;
  const items: QuotationItem[] = qs.items.map((it) => {
    const p = pMap[it.product];
    const subtotal = yuan(p.price * it.qty);
    const netAmount = yuan(subtotal * (1 - it.discount));
    total = yuan(total + subtotal);
    net = yuan(net + netAmount);
    return {
      id: `QI${String(itemIdx++).padStart(4, '0')}`, quotationId: qs.id, productId: p.id,
      productName: p.name, spec: p.spec, unit: p.unit, price: p.price, quantity: it.qty,
      discountRate: it.discount, subtotal, netAmount,
    };
  });
  quotationItems.push(...items);

  const discountRate = total > 0 ? yuan(1 - net / total) : 0;

  // 审批链：依据 FR-06-03 决策表推导
  const needTwoLevel = discountRate >= 0.3 || net >= 1_000_000;
  const needOneLevel = discountRate >= 0.15;
  const approverIds = needTwoLevel ? ['U002', 'U007'] : needOneLevel ? ['U002'] : [];
  const done = qs.approvals ?? [];
  const chain = approverIds.map((aid, i) => {
    const rec = done[i];
    return {
      step: i + 1,
      approverId: aid,
      approverName: uName(aid),
      approverRole: users.find((u) => u.id === aid)!.role,
      status: (rec ? (rec.action === 'APPROVED' ? 'APPROVED' : 'REJECTED') : 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED',
      comment: rec?.comment,
      at: rec?.at,
    };
  });

  const currentStep = qs.status === 'APPROVING'
    ? (chain.findIndex((c) => c.status === 'PENDING') + 1) || chain.length
    : chain.filter((c) => c.status !== 'PENDING').length;

  quotations.push({
    id: qs.id, opportunityId: qs.opp, opportunityTitle: opp.title,
    customerId: opp.customerId, customerName: opp.customerName,
    totalAmount: total, discountAmount: net, discountRate,
    validUntil: qs.validUntil, payMethod: qs.payMethod, status: qs.status,
    approvalChain: chain, currentStep,
    createdBy: qs.createdBy, createdByName: uName(qs.createdBy),
    createdAt: qs.createdAt, remark: qs.remark,
  });

  // 审计留痕
  if (chain.length > 0) {
    approvalRecords.push({
      id: `AR${String(arIdx++).padStart(4, '0')}`, bizType: 'QUOTATION', bizId: qs.id, step: 0,
      approverId: qs.createdBy, approverName: uName(qs.createdBy),
      approverRole: users.find((u) => u.id === qs.createdBy)!.role,
      action: 'SUBMITTED', comment: '提交审批', createdAt: qs.createdAt,
    });
  }
  done.forEach((rec, i) => {
    approvalRecords.push({
      id: `AR${String(arIdx++).padStart(4, '0')}`, bizType: 'QUOTATION', bizId: qs.id, step: i + 1,
      approverId: rec.approver, approverName: uName(rec.approver),
      approverRole: users.find((u) => u.id === rec.approver)!.role,
      action: rec.action, comment: rec.comment, createdAt: rec.at,
    });
  });
}

/* ==================== 订单 ==================== */

interface OrderSeed {
  id: string; quote?: string; cust: string; amount: number; contractNo: string;
  signDate: string; deliveryDate?: string; payMethod: string; status: Order['status'];
  owner: string; auditBy?: string; auditAt?: string; remark: string;
}

const orderSeeds: OrderSeed[] = [
  { id: 'SO20260001', quote: 'Q20260006', cust: 'C20260005', amount: 1480000, contractNo: 'HT-2026-0618', signDate: '2026-06-20', deliveryDate: '2026-12-31', payMethod: '三三四', status: 'EXECUTING', owner: 'U005', auditBy: 'U003', auditAt: '2026-06-21 10:30', remark: '分两期交付，一期已完成上线' },
  { id: 'SO20260002', quote: 'Q20260007', cust: 'C20260009', amount: 2050000, contractNo: 'HT-2026-0512', signDate: '2026-05-15', deliveryDate: '2026-09-30', payMethod: '三三四', status: 'COMPLETED', owner: 'U006', auditBy: 'U003', auditAt: '2026-05-16 09:00', remark: '已验收并收回全部款项' },
  { id: 'SO20260003', quote: 'Q20260003', cust: 'C20260004', amount: 480000, contractNo: 'HT-2026-0930', signDate: '2026-09-30', deliveryDate: '2026-11-30', payMethod: '全额预付', status: 'SIGNED', owner: 'U001', auditBy: 'U008', auditAt: '2026-10-01 11:20', remark: '预付全款已到账' },
  { id: 'SO20260004', quote: 'Q20260004', cust: 'C20260008', amount: 760000, contractNo: 'HT-2026-0918', signDate: '2026-09-18', deliveryDate: '2026-12-15', payMethod: '验收后付', status: 'SIGNED', owner: 'U005', auditBy: 'U003', auditAt: '2026-09-19 14:00', remark: '客户要求分四期回款，已手工调整计划' },
  { id: 'SO20260005', cust: 'C20260007', amount: 880000, contractNo: 'HT-2026-1008', signDate: '2026-10-08', deliveryDate: '2027-03-31', payMethod: '三三四', status: 'PENDING', owner: 'U001', remark: '待商务审核合同条款' },
  { id: 'SO20260006', cust: 'C20260006', amount: 320000, contractNo: 'HT-2026-0925', signDate: '2026-09-25', deliveryDate: '2026-11-25', payMethod: '全额预付', status: 'SIGNED', owner: 'U006', auditBy: 'U008', auditAt: '2026-09-26 09:40', remark: '客户数据平台一期' },
  { id: 'SO20260007', cust: 'C20260001', amount: 960000, contractNo: 'HT-2026-0415', signDate: '2026-04-15', payMethod: '三三四', status: 'CANCELLED', owner: 'U001', auditBy: 'U003', auditAt: '2026-04-16 10:00', remark: '客户内部预算调整，双方协商取消' },
];

/* ==================== 回款计划 ==================== */

interface PlanSeed { order: string; period: number; amount: number; date: string }
const planSeeds: PlanSeed[] = [
  { order: 'SO20260001', period: 1, amount: 444000, date: '2026-06-27' },
  { order: 'SO20260001', period: 2, amount: 444000, date: '2026-07-20' },
  { order: 'SO20260001', period: 3, amount: 592000, date: '2026-09-18' },
  { order: 'SO20260002', period: 1, amount: 615000, date: '2026-05-22' },
  { order: 'SO20260002', period: 2, amount: 615000, date: '2026-06-14' },
  { order: 'SO20260002', period: 3, amount: 820000, date: '2026-08-13' },
  { order: 'SO20260003', period: 1, amount: 480000, date: '2026-10-07' },
  { order: 'SO20260004', period: 1, amount: 190000, date: '2026-09-25' },
  { order: 'SO20260004', period: 2, amount: 190000, date: '2026-10-25' },
  { order: 'SO20260004', period: 3, amount: 190000, date: '2026-11-25' },
  { order: 'SO20260004', period: 4, amount: 190000, date: '2026-12-31' },
  { order: 'SO20260005', period: 1, amount: 264000, date: '2026-10-15' },
  { order: 'SO20260005', period: 2, amount: 264000, date: '2026-11-08' },
  { order: 'SO20260005', period: 3, amount: 352000, date: '2027-01-06' },
  { order: 'SO20260006', period: 1, amount: 320000, date: '2026-10-02' },
  { order: 'SO20260007', period: 1, amount: 288000, date: '2026-04-22' },
  { order: 'SO20260007', period: 2, amount: 288000, date: '2026-05-15' },
  { order: 'SO20260007', period: 3, amount: 384000, date: '2026-07-14' },
];

/* ==================== 回款记录 ==================== */

interface PaySeed {
  id: string; order: string; period: number; amount: number; method: Payment['method'];
  date: string; serial: string; status: Payment['status']; by: string;
  invoiceNo: string; invoiceStatus: Payment['invoiceStatus']; invoiceDate?: string; confirmBy?: string; remark: string;
}
const paySeeds: PaySeed[] = [
  { id: 'PAY20260001', order: 'SO20260001', period: 1, amount: 444000, method: '电汇', date: '2026-06-26', serial: 'TR20260626001', status: 'CONFIRMED', by: 'U005', invoiceNo: '02658801', invoiceStatus: 'ISSUED', invoiceDate: '2026-06-28', confirmBy: 'U003', remark: '首付款' },
  { id: 'PAY20260002', order: 'SO20260001', period: 2, amount: 200000, method: '电汇', date: '2026-07-18', serial: 'TR20260718002', status: 'CONFIRMED', by: 'U005', invoiceNo: '02658802', invoiceStatus: 'ISSUED', invoiceDate: '2026-07-20', confirmBy: 'U003', remark: '二期部分回款，余额客户承诺下月补齐' },
  { id: 'PAY20260003', order: 'SO20260002', period: 1, amount: 615000, method: '电汇', date: '2026-05-21', serial: 'TR20260521001', status: 'CONFIRMED', by: 'U006', invoiceNo: '02658701', invoiceStatus: 'SENT', invoiceDate: '2026-05-23', confirmBy: 'U003', remark: '首付款' },
  { id: 'PAY20260004', order: 'SO20260002', period: 2, amount: 615000, method: '承兑', date: '2026-06-13', serial: 'AC20260613001', status: 'CONFIRMED', by: 'U006', invoiceNo: '02658702', invoiceStatus: 'SENT', invoiceDate: '2026-06-15', confirmBy: 'U008', remark: '银行承兑汇票，6 个月期' },
  { id: 'PAY20260005', order: 'SO20260002', period: 3, amount: 820000, method: '电汇', date: '2026-08-12', serial: 'TR20260812001', status: 'CONFIRMED', by: 'U006', invoiceNo: '02658703', invoiceStatus: 'SENT', invoiceDate: '2026-08-14', confirmBy: 'U003', remark: '尾款，验收后支付' },
  { id: 'PAY20260006', order: 'SO20260003', period: 1, amount: 480000, method: '电汇', date: '2026-10-05', serial: 'TR20261005001', status: 'CONFIRMED', by: 'U001', invoiceNo: '02658901', invoiceStatus: 'SENT', invoiceDate: '2026-10-06', confirmBy: 'U008', remark: '全额预付' },
  { id: 'PAY20260007', order: 'SO20260006', period: 1, amount: 320000, method: '电汇', date: '2026-09-30', serial: 'TR20260930001', status: 'CONFIRMED', by: 'U006', invoiceNo: '02658902', invoiceStatus: 'ISSUED', invoiceDate: '2026-10-01', confirmBy: 'U008', remark: '全额预付' },
  { id: 'PAY20260008', order: 'SO20260004', period: 1, amount: 150000, method: '电汇', date: '2026-09-28', serial: 'TR20260928001', status: 'REGISTERED', by: 'U005', invoiceNo: '', invoiceStatus: 'NONE', remark: '客户已付款，流水待财务核对（未确认不计入统计）' },
  { id: 'PAY20260009', order: 'SO20260001', period: 3, amount: 300000, method: '承兑', date: '2026-09-15', serial: 'AC20260915001', status: 'REGISTERED', by: 'U005', invoiceNo: '', invoiceStatus: 'NONE', remark: '客户开出承兑汇票，待财务入账' },
];

const paymentPlans: PaymentPlan[] = [];
const planIdOf = (orderId: string, period: number) => `PP${orderId.slice(-4)}-${period}`;

for (const ps of planSeeds) {
  paymentPlans.push({
    id: planIdOf(ps.order, ps.period), orderId: ps.order, orderNo: ps.order,
    customerName: cName(orderSeeds.find((o) => o.id === ps.order)!.cust),
    period: ps.period, planAmount: ps.amount, planDate: ps.date, paidAmount: 0, status: 'UNPAID',
  });
}

const payments: Payment[] = paySeeds.map((p) => ({
  id: p.id, orderId: p.order, orderNo: p.order, planId: planIdOf(p.order, p.period),
  customerName: cName(orderSeeds.find((o) => o.id === p.order)!.cust),
  amount: p.amount, method: p.method, payDate: p.date, serialNo: p.serial, status: p.status,
  invoiceNo: p.invoiceNo, invoiceStatus: p.invoiceStatus, invoiceDate: p.invoiceDate,
  registeredBy: p.by, registeredByName: uName(p.by),
  confirmedBy: p.confirmBy, confirmedByName: p.confirmBy ? uName(p.confirmBy) : undefined,
  confirmedAt: p.confirmBy ? `${p.date} 17:00` : undefined, remark: p.remark,
}));

/** 依据已确认回款回填计划与订单的已回款金额，并计算计划状态（BR-07） */
function recalcPayments(): void {
  for (const plan of paymentPlans) {
    const confirmed = payments.filter(
      (p) => p.planId === plan.id && p.status === 'CONFIRMED',
    );
    plan.paidAmount = yuan(confirmed.reduce((a, b) => a + b.amount, 0));
    const remain = yuan(plan.planAmount - plan.paidAmount);
    if (remain <= 0) plan.status = 'PAID';
    else if (plan.paidAmount > 0) plan.status = plan.planDate < TODAY ? 'OVERDUE' : 'PARTIAL';
    else plan.status = plan.planDate < TODAY ? 'OVERDUE' : 'UNPAID';
  }
  for (const o of orderSeeds) {
    const paid = yuan(
      payments.filter((p) => p.orderId === o.id && p.status === 'CONFIRMED').reduce((a, b) => a + b.amount, 0),
    );
    (o as OrderSeed & { paid?: number }).paid = paid;
  }
}
recalcPayments();

const orders: Order[] = orderSeeds.map((o) => ({
  id: o.id, quotationId: o.quote, customerId: o.cust, customerName: cName(o.cust),
  contractNo: o.contractNo, amount: o.amount, signDate: o.signDate, deliveryDate: o.deliveryDate,
  payMethod: o.payMethod, status: o.status,
  paidAmount: (o as OrderSeed & { paid?: number }).paid ?? 0,
  ownerId: o.owner, ownerName: uName(o.owner),
  auditBy: o.auditBy, auditByName: o.auditBy ? uName(o.auditBy) : undefined, auditAt: o.auditAt,
  remark: o.remark, createdAt: o.signDate,
}));

/* ==================== 线索 ==================== */

interface LeadSeed {
  id: string; company: string; contact: string; phone: string; source: string; industry: string;
  level: 'HIGH' | 'MID' | 'LOW'; status: Lead['status']; owner?: string; createdAt: string;
  nextFollow?: string; remark: string; lostReason?: string; convertedCustomer?: string;
}

const leadSeeds: LeadSeed[] = [
  { id: 'L20260001', company: '中鼎重工机械有限公司', contact: '罗天成', phone: '13800050001', source: '客户转介绍', industry: '制造业', level: 'HIGH', status: 'CONVERTED', owner: 'U005', createdAt: '2026-03-20', remark: '老客户介绍，需求明确', convertedCustomer: 'C20260005' },
  { id: 'L20260002', company: '泰和建筑集团股份有限公司', contact: '黄志强', phone: '13800090001', source: '客户转介绍', industry: '建筑工程', level: 'HIGH', status: 'CONVERTED', owner: 'U006', createdAt: '2026-03-15', remark: '集团级客户，决策链较长', convertedCustomer: 'C20260009' },
  { id: 'L20260003', company: '华远科技有限公司', contact: '周建国', phone: '13800010001', source: '官网表单', industry: '制造业', level: 'HIGH', status: 'CONVERTED', owner: 'U001', createdAt: '2026-04-10', remark: '官网提交需求，需求描述详细', convertedCustomer: 'C20260001' },
  { id: 'L20260004', company: '广联电子科技有限公司', contact: '彭亮', phone: '13811110001', source: '展会名录', industry: '制造业', level: 'MID', status: 'LOST', owner: 'U001', createdAt: '2026-04-18', remark: '多次联系未接通', lostReason: '联系不上' },
  { id: 'L20260005', company: '明德医疗器械股份公司', contact: '郑立群', phone: '13800020001', source: '展会名录', industry: '医疗健康', level: 'HIGH', status: 'CONVERTED', owner: 'U005', createdAt: '2026-04-18', remark: '医疗展会上交换名片', convertedCustomer: 'C20260002' },
  { id: 'L20260006', company: '南方精密仪器厂', contact: '廖永昌', phone: '13811110002', source: '电话咨询', industry: '制造业', level: 'MID', status: 'LOST', owner: 'U006', createdAt: '2026-04-25', remark: '预算仅 5 万，低于最低配置', lostReason: '预算不足' },
  { id: 'L20260007', company: '恒通供应链管理有限公司', contact: '尹志强', phone: '13811110003', source: '官网表单', industry: '物流运输', level: 'MID', status: 'FOLLOWING', owner: 'U006', createdAt: '2026-05-06', nextFollow: addDays(TODAY, 2), remark: '关注仓储模块，需二次演示' },
  { id: 'L20260008', company: '速达物流集团有限公司', contact: '马文涛', phone: '13800030001', source: '官网表单', industry: '物流运输', level: 'HIGH', status: 'CONVERTED', owner: 'U006', createdAt: '2026-05-06', remark: '需求明确，已进入方案阶段', convertedCustomer: 'C20260003' },
  { id: 'L20260009', company: '启明教育集团', contact: '章丽华', phone: '13811110004', source: '广告投放', industry: '教育培训', level: 'MID', status: 'FOLLOWING', owner: 'U001', createdAt: '2026-05-14', nextFollow: TODAY, remark: '已发送产品资料，等待回复' },
  { id: 'L20260010', company: '博远化工有限公司', contact: '谭建国', phone: '13811110005', source: '展会名录', industry: '其他', level: 'LOW', status: 'FOLLOWING', owner: 'U005', createdAt: '2026-05-20', nextFollow: addDays(TODAY, 5), remark: '仅收集资料，暂无明确预算' },
  { id: 'L20260011', company: '星海教育科技有限公司', contact: '许海燕', phone: '13800040001', source: '广告投放', industry: '教育培训', level: 'MID', status: 'CONVERTED', owner: 'U001', createdAt: '2026-05-17', remark: '竞品替换需求', convertedCustomer: 'C20260004' },
  { id: 'L20260012', company: '中环环保设备有限公司', contact: '石磊', phone: '13811110006', source: '电话咨询', industry: '能源电力', level: 'MID', status: 'FOLLOWING', owner: 'U005', createdAt: '2026-06-08', nextFollow: addDays(TODAY, 1), remark: '关注设备联网，邀约现场拜访' },
  { id: 'L20260013', company: '云图信息技术有限公司', contact: '蒋雨薇', phone: '13800060001', source: '官网表单', industry: '信息技术', level: 'HIGH', status: 'CONVERTED', owner: 'U006', createdAt: '2026-05-30', remark: '技术负责人主动咨询', convertedCustomer: 'C20260006' },
  { id: 'L20260014', company: '力天重工集团', contact: '龙志远', phone: '13811110007', source: '客户转介绍', industry: '制造业', level: 'HIGH', status: 'FOLLOWING', owner: 'U001', createdAt: '2026-06-22', nextFollow: TODAY, remark: '规模较大，需总监级别拜访' },
  { id: 'L20260015', company: '恒信金融信息服务公司', contact: '沈志远', phone: '13800070001', source: '电话咨询', industry: '金融保险', level: 'MID', status: 'CONVERTED', owner: 'U001', createdAt: '2026-06-13', remark: '风控系统咨询', convertedCustomer: 'C20260007' },
  { id: 'L20260016', company: '新元材料科技有限公司', contact: '夏文俊', phone: '13811110008', source: '广告投放', industry: '其他', level: 'LOW', status: 'NEW', createdAt: '2026-09-25', remark: '广告落地页留资，待分配' },
  { id: 'L20260017', company: '绿源新能源科技有限公司', contact: '崔明', phone: '13800080001', source: '展会名录', industry: '能源电力', level: 'HIGH', status: 'CONVERTED', owner: 'U005', createdAt: '2026-07-01', remark: '光伏行业，需求急迫', convertedCustomer: 'C20260008' },
  { id: 'L20260018', company: '德邦智能装备公司', contact: '万强', phone: '13811110009', source: '官网表单', industry: '制造业', level: 'MID', status: 'NEW', createdAt: '2026-09-28', remark: '官网注册试用，待分配' },
  { id: 'L20260019', company: '优鲜零售连锁有限公司', contact: '杜鹏', phone: '13800100001', source: '官网表单', industry: '零售快消', level: 'MID', status: 'CONVERTED', owner: 'U001', createdAt: '2026-07-20', remark: '门店系统升级需求', convertedCustomer: 'C20260010' },
  { id: 'L20260020', company: '华创医疗器械公司', contact: '祁红', phone: '13811110010', source: '客户转介绍', industry: '医疗健康', level: 'MID', status: 'NEW', createdAt: '2026-10-02', remark: '同行业客户推荐，待分配' },
  { id: 'L20260021', company: '智联通信设备制造公司', contact: '袁伟', phone: '13800110001', source: '客户转介绍', industry: '信息技术', level: 'HIGH', status: 'CONVERTED', owner: 'U005', createdAt: '2026-08-03', remark: '5G 相关项目，预算充足', convertedCustomer: 'C20260011' },
  { id: 'L20260022', company: '东方电气自动化公司', contact: '毕海涛', phone: '13811110011', source: '展会名录', industry: '能源电力', level: 'MID', status: 'NEW', createdAt: '2026-10-05', remark: '展会收集，待初步触达' },
  { id: 'L20260023', company: '瑞康生物制药有限公司', contact: '龚学明', phone: '13800120001', source: '电话咨询', industry: '医疗健康', level: 'MID', status: 'CONVERTED', owner: 'U006', createdAt: '2026-08-26', remark: 'GMP 合规需求', convertedCustomer: 'C20260012' },
  { id: 'L20260024', company: '远景智慧城市建设公司', contact: '石英', phone: '13811110012', source: '广告投放', industry: '建筑工程', level: 'LOW', status: 'NEW', createdAt: '2026-10-08', remark: '尚未接触，待分配' },
];

const leads: Lead[] = leadSeeds.map((l) => ({
  id: l.id, companyName: l.company, contactName: l.contact, phone: l.phone, source: l.source,
  industry: l.industry, level: l.level, status: l.status,
  ownerId: l.owner ?? null, ownerName: l.owner ? uName(l.owner) : undefined,
  remark: l.remark, lostReason: l.lostReason,
  createdBy: l.owner ?? 'U004', createdAt: l.createdAt,
  nextFollowAt: l.nextFollow,
  convertedAt: l.status === 'CONVERTED' ? addDays(l.createdAt, 3) : undefined,
}));

/* ==================== 跟进记录 ==================== */

const followUpSeeds: { lead: string; type: FollowUp['type']; content: string; result: string; by: string; at: string; next?: string }[] = [
  { lead: 'L20260007', type: '电话', content: '首次电话接触，了解其当前使用的仓储系统及痛点', result: '客户反映现有系统无法支持多仓协同，愿意安排演示', by: 'U006', at: '2026-05-08 10:00', next: '2026-05-15' },
  { lead: 'L20260007', type: '拜访', content: '现场拜访运营副总，演示仓储管理模块完整流程', result: '客户认可方案，要求提供报价与实施周期', by: 'U006', at: '2026-06-18 14:00', next: addDays(TODAY, 2) },
  { lead: 'L20260009', type: '电话', content: '发送产品白皮书与教育行业案例集', result: '客户表示内部讨论后再联系', by: 'U001', at: '2026-06-02 09:30', next: TODAY },
  { lead: 'L20260010', type: '邮件', content: '发送标准产品资料包', result: '客户回复暂无预算，保持联系', by: 'U005', at: '2026-06-15 11:20', next: addDays(TODAY, 5) },
  { lead: 'L20260012', type: '电话', content: '介绍设备联网方案，确认现场拜访时间', result: '约下周三现场拜访', by: 'U005', at: '2026-07-02 15:40', next: addDays(TODAY, 1) },
  { lead: 'L20260014', type: '拜访', content: '与销售总监共同拜访，客户介绍集团整体信息化规划', result: '客户明确下半年有预算，需集团层面立项', by: 'U001', at: '2026-09-20 10:00', next: TODAY },
  { lead: 'L20260004', type: '电话', content: '连续三次电话未接通', result: '放弃跟进，标记废弃', by: 'U001', at: '2026-05-10 16:00' },
  { lead: 'L20260006', type: '电话', content: '客户明确表示预算仅 5 万元', result: '低于最低配置价格，标记废弃', by: 'U006', at: '2026-05-12 09:00' },
  { lead: 'L20260003', type: '拜访', content: '现场调研，梳理 MES 集成需求清单', result: '需求明确，进入方案设计阶段', by: 'U001', at: '2026-04-15 13:30' },
  { lead: 'L20260005', type: '拜访', content: '数字化手术室需求调研', result: '已输出需求说明书，客户确认', by: 'U005', at: '2026-05-08 10:30' },
  { lead: 'L20260021', type: '电话', content: '沟通 5G 基站监控项目背景', result: '客户要求先做 POC 验证', by: 'U005', at: '2026-08-10 14:00' },
  { lead: 'L20260023', type: '微信', content: '发送 GMP 合规方案要点', result: '客户邀请现场交流', by: 'U006', at: '2026-09-01 09:15' },
];

const followUps: FollowUp[] = followUpSeeds.map((f, i) => ({
  id: `FU${String(i + 1).padStart(4, '0')}`, leadId: f.lead, type: f.type, content: f.content,
  result: f.result, nextFollowAt: f.next, createdBy: f.by, createdByName: uName(f.by), createdAt: f.at,
}));

/* ==================== 销售目标 ==================== */

const targets: Target[] = [
  { id: 'TG001', userId: 'U001', userName: '张伟', period: '2026-Q4', amount: 2000000, achieved: 0 },
  { id: 'TG002', userId: 'U005', userName: '陈静', period: '2026-Q4', amount: 3000000, achieved: 0 },
  { id: 'TG003', userId: 'U006', userName: '刘洋', period: '2026-Q4', amount: 2500000, achieved: 0 },
  { id: 'TG004', userId: 'U002', userName: '李娜', period: '2026-Q4', amount: 7500000, achieved: 0 },
];

// 目标达成额 = 该销售名下订单的已确认回款合计
for (const t of targets) {
  const mine = orders.filter((o) => o.ownerId === t.userId || (t.userId === 'U002' && ['U001', 'U005'].includes(o.ownerId)));
  t.achieved = yuan(mine.reduce((a, b) => a + b.paidAmount, 0));
}

/* ==================== 活动日志 ==================== */

const activityLogs: ActivityLog[] = [
  { id: 'AL001', actorId: 'U005', actorName: '陈静', action: '提交报价审批', target: 'Q20260002 明德医疗器械', at: '2026-10-06 16:40' },
  { id: 'AL002', actorId: 'U002', actorName: '李娜', action: '驳回报价', target: 'Q20260005 智联通信设备', at: '2026-09-26 14:22' },
  { id: 'AL003', actorId: 'U006', actorName: '刘洋', action: '登记回款', target: 'PAY20260007 32.00 万', at: '2026-09-30 11:00' },
  { id: 'AL004', actorId: 'U008', actorName: '周敏', action: '确认回款到账', target: 'PAY20260006 48.00 万', at: '2026-10-05 17:20' },
  { id: 'AL005', actorId: 'U001', actorName: '张伟', action: '推进商机阶段', target: 'O20260001 → 商务谈判', at: '2026-09-13 10:00' },
  { id: 'AL006', actorId: 'U003', actorName: '王芳', action: '商务审核通过', target: 'SO20260001 中鼎重工', at: '2026-06-21 10:30' },
  { id: 'AL007', actorId: 'U005', actorName: '陈静', action: '线索转化', target: 'L20260021 → 智联通信设备', at: '2026-08-05 09:00' },
  { id: 'AL008', actorId: 'U001', actorName: '张伟', action: '创建商机', target: 'O20260014 数据仓库建设', at: '2026-06-20 14:00' },
];

/* ==================== 导出 ==================== */

export function buildSeedDb(): Database {
  return {
    version: DB_VERSION,
    users, leads, followUps, customers, contacts, opportunities, stageHistories,
    products, quotations, quotationItems, approvalRecords, orders, paymentPlans, payments,
    targets, activityLogs,
  };
}

export const DEMO_ACCOUNTS: { username: string; name: string; role: Role; desc: string }[] = [
  { username: 'zhangwei', name: '张伟', role: 'SALES', desc: '跟进线索、推进商机、发起报价' },
  { username: 'lina', name: '李娜', role: 'MANAGER', desc: '分配线索、审批报价（一级）' },
  { username: 'wangfang', name: '王芳', role: 'FINANCE', desc: '审核合同、确认回款、开票' },
  { username: 'zhaoqiang', name: '赵强', role: 'ADMIN', desc: '用户、产品、数据字典维护' },
];

export { now };
