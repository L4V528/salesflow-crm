/**
 * 业务规则集中配置
 * 依据 NFR-M-01：业务规则必须集中配置，禁止在组件中硬编码
 * 对应《软件需求规格说明书》FR-05 / FR-06 / FR-07 / FR-08 与《数据库设计说明书》第 4 章数据字典
 */

import type { Role, Stage, CustomerLevel, LeadLevel } from '@/types';

/* ============ 商机阶段 ============ */

export interface StageConfig {
  code: Stage;
  name: string;
  probability: number;
  /** 进入该阶段的前置条件说明（用于拒绝时提示） */
  requirement: string;
  color: string;
}

export const STAGES: StageConfig[] = [
  { code: 'S1', name: '初步接洽', probability: 10, requirement: '无特殊要求', color: '#64748b' },
  { code: 'S2', name: '需求确认', probability: 30, requirement: '需完成客户需求调研并记录需求要点', color: '#0ea5e9' },
  { code: 'S3', name: '方案报价', probability: 60, requirement: '需至少创建 1 张报价单', color: '#8b5cf6' },
  { code: 'S4', name: '商务谈判', probability: 80, requirement: '需存在审批通过的报价单', color: '#f59e0b' },
  { code: 'S5', name: '赢单', probability: 100, requirement: '需存在已签约的订单', color: '#16a34a' },
];

export const STAGE_MAP: Record<Stage, StageConfig> = STAGES.reduce(
  (acc, s) => ({ ...acc, [s.code]: s }),
  {} as Record<Stage, StageConfig>,
);

/* ============ 审批阈值 ============ */

/** 折扣率 < 该值无需审批 */
export const DISCOUNT_NO_APPROVAL = 0.15;
/** 折扣率 ≥ 该值需两级审批 */
export const DISCOUNT_TWO_LEVEL = 0.3;
/** 金额 ≥ 该值强制两级审批（元） */
export const AMOUNT_FORCE_TWO_LEVEL = 1_000_000;

/* ============ 客户等级阈值 ============ */

/** 累计成交 ≥ 该值评定为 A 级（元） */
export const CUSTOMER_LEVEL_A = 500_000;
/** 累计成交 ≥ 该值评定为 B 级（元） */
export const CUSTOMER_LEVEL_B = 100_000;

export function calcCustomerLevel(total: number): CustomerLevel {
  if (total >= CUSTOMER_LEVEL_A) return 'A';
  if (total >= CUSTOMER_LEVEL_B) return 'B';
  return 'C';
}

/* ============ 回款计划模板 ============ */

export interface PayPlanTemplate {
  name: string;
  /** 每期比例 */
  ratios: number[];
  /** 每期相对签订日期的偏移天数 */
  offsets: number[];
}

export const PAY_PLAN_TEMPLATES: Record<string, PayPlanTemplate> = {
  '全额预付': { name: '全额预付', ratios: [1], offsets: [7] },
  '三三四': { name: '三三四', ratios: [0.3, 0.3, 0.4], offsets: [7, 30, 90] },
  '验收后付': { name: '验收后付', ratios: [0.5, 0.5], offsets: [7, 15] },
};

export const PAY_METHODS = ['全额预付', '三三四', '验收后付'];

/* ============ 角色与权限 ============ */

export const ROLE_LABEL: Record<Role, string> = {
  SALES: '销售员',
  MANAGER: '销售经理',
  FINANCE: '商务财务',
  ADMIN: '系统管理员',
};

/** 各角色可见的菜单 key */
export const ROLE_MENUS: Record<Role, string[]> = {
  SALES: ['dashboard', 'leads', 'customers', 'opportunities', 'quotations', 'orders', 'payments', 'analytics'],
  MANAGER: ['dashboard', 'leads', 'customers', 'opportunities', 'quotations', 'orders', 'payments', 'analytics'],
  FINANCE: ['dashboard', 'orders', 'payments', 'analytics'],
  ADMIN: ['dashboard', 'leads', 'customers', 'opportunities', 'quotations', 'orders', 'payments', 'analytics', 'admin'],
};

/* ============ 枚举字典 ============ */

export const LEAD_SOURCES = ['官网表单', '展会名录', '电话咨询', '客户转介绍', '广告投放', '其他'];
export const INDUSTRIES = ['制造业', '信息技术', '医疗健康', '教育培训', '金融保险', '物流运输', '能源电力', '建筑工程', '零售快消', '其他'];
export const LEAD_LEVELS: { value: LeadLevel; label: string }[] = [
  { value: 'HIGH', label: '高' },
  { value: 'MID', label: '中' },
  { value: 'LOW', label: '低' },
];
export const LOST_REASONS = ['价格过高', '竞品胜出', '无预算', '项目取消', '客户失联', '其他'];
export const LEAD_LOST_REASONS = ['无采购需求', '预算不足', '已选竞品', '联系不上', '信息无效', '其他'];
export const FOLLOW_UP_TYPES: import('@/types').FollowUpType[] = ['电话', '拜访', '邮件', '微信', '其他'];
export const PAY_METHODS_PAYMENT: import('@/types').PayMethod[] = ['电汇', '承兑', '现金', 'POS'];

/* ============ 状态展示字典 ============ */

export const LEAD_STATUS: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: '待分配', tone: 'warning' },
  FOLLOWING: { label: '跟进中', tone: 'info' },
  CONVERTED: { label: '已转化', tone: 'success' },
  LOST: { label: '已废弃', tone: 'neutral' },
};

export const QUOTATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: '草稿', tone: 'neutral' },
  APPROVING: { label: '审批中', tone: 'warning' },
  APPROVED: { label: '已通过', tone: 'success' },
  REJECTED: { label: '已驳回', tone: 'danger' },
  CONVERTED: { label: '已转订单', tone: 'info' },
  EXPIRED: { label: '已过期', tone: 'neutral' },
};

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: '待签约', tone: 'warning' },
  SIGNED: { label: '已签约', tone: 'info' },
  EXECUTING: { label: '执行中', tone: 'primary' },
  COMPLETED: { label: '已完成', tone: 'success' },
  CANCELLED: { label: '已取消', tone: 'neutral' },
};

export const PLAN_STATUS: Record<string, { label: string; tone: Tone }> = {
  UNPAID: { label: '未回款', tone: 'neutral' },
  PARTIAL: { label: '部分回款', tone: 'warning' },
  PAID: { label: '已回款', tone: 'success' },
  OVERDUE: { label: '逾期', tone: 'danger' },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  REGISTERED: { label: '待确认', tone: 'warning' },
  CONFIRMED: { label: '已确认', tone: 'success' },
};

export const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  NONE: { label: '未开票', tone: 'neutral' },
  ISSUED: { label: '已开票', tone: 'info' },
  SENT: { label: '已寄出', tone: 'success' },
};

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary';
