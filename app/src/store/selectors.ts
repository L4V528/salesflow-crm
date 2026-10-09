/**
 * 派生数据计算与权限过滤
 * 对应 FR-01-04 数据可见性规则
 */

import type { Database, User, Lead, Opportunity, Quotation, Order, PaymentPlan, Role, Stage } from '@/types';
import { yuan, today } from '@/lib/format';

/** 同部门成员 ID 集合（用于 MANAGER 的数据可见范围） */
export function deptMemberIds(db: Database, user: User): string[] {
  return db.users.filter((u) => u.dept === user.dept).map((u) => u.id);
}

/** 判断某数据归属人是否对当前用户可见 */
function visible(db: Database, user: User, ownerId: string | null | undefined, roleRule?: Role[]): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (roleRule?.includes(user.role)) return true;
  if (ownerId == null) return false;
  if (user.role === 'MANAGER') return deptMemberIds(db, user).includes(ownerId);
  return ownerId === user.id;
}

export function visibleLeads(db: Database, user: User | null): Lead[] {
  if (!user) return [];
  if (user.role === 'ADMIN') return db.leads;
  if (user.role === 'MANAGER') {
    const ids = deptMemberIds(db, user);
    return db.leads.filter((l) => l.ownerId == null || ids.includes(l.ownerId));
  }
  if (user.role === 'FINANCE') return [];
  return db.leads.filter((l) => l.ownerId === user.id || l.ownerId == null);
}

export function visibleCustomers(db: Database, user: User | null) {
  if (!user) return [];
  if (user.role === 'ADMIN' || user.role === 'FINANCE') return db.customers;
  return db.customers.filter((c) => visible(db, user, c.ownerId));
}

export function visibleOpportunities(db: Database, user: User | null): Opportunity[] {
  if (!user) return [];
  if (user.role === 'ADMIN') return db.opportunities;
  if (user.role === 'MANAGER') {
    const ids = deptMemberIds(db, user);
    return db.opportunities.filter((o) => ids.includes(o.ownerId));
  }
  if (user.role === 'FINANCE') return db.opportunities.filter((o) => o.status === 'WON');
  return db.opportunities.filter((o) => o.ownerId === user.id);
}

export function visibleQuotations(db: Database, user: User | null): Quotation[] {
  if (!user) return [];
  if (user.role === 'ADMIN') return db.quotations;
  if (user.role === 'MANAGER') {
    const ids = deptMemberIds(db, user);
    return db.quotations.filter((q) => ids.includes(q.createdBy));
  }
  return db.quotations.filter((q) => q.createdBy === user.id);
}

/** 待我审批的报价 */
export function pendingMyApproval(db: Database, user: User | null): Quotation[] {
  if (!user) return [];
  return db.quotations.filter(
    (q) => q.status === 'APPROVING' && q.approvalChain.some((s) => s.approverId === user.id && s.status === 'PENDING' && s.step === q.currentStep),
  );
}

export function visibleOrders(db: Database, user: User | null): Order[] {
  if (!user) return [];
  if (user.role === 'ADMIN' || user.role === 'FINANCE') return db.orders;
  if (user.role === 'MANAGER') {
    const ids = deptMemberIds(db, user);
    return db.orders.filter((o) => ids.includes(o.ownerId));
  }
  return db.orders.filter((o) => o.ownerId === user.id);
}

export function visiblePlans(db: Database, user: User | null): PaymentPlan[] {
  const orders = new Set(visibleOrders(db, user).map((o) => o.id));
  return db.paymentPlans.filter((p) => orders.has(p.orderId));
}

/* ==================== 工作台统计 ==================== */

export function dashboardStats(db: Database, user: User | null) {
  const todayStr = today();
  const leads = visibleLeads(db, user);
  const opps = visibleOpportunities(db, user);
  const plans = visiblePlans(db, user);
  return {
    todoLeads: leads.filter((l) => l.status === 'FOLLOWING' && l.nextFollowAt && l.nextFollowAt <= todayStr).length,
    openOpportunities: opps.filter((o) => o.status === 'OPEN').length,
    pendingApproval: pendingMyApproval(db, user).length,
    planAmountThisMonth: yuan(
      plans.filter((p) => p.status !== 'PAID' && p.planDate.slice(0, 7) === todayStr.slice(0, 7)).reduce((a, b) => a + (b.planAmount - b.paidAmount), 0),
    ),
    overdueAmount: yuan(plans.filter((p) => p.status === 'OVERDUE').reduce((a, b) => a + (b.planAmount - b.paidAmount), 0)),
    overdueCount: plans.filter((p) => p.status === 'OVERDUE').length,
  };
}

/* ==================== 漏斗 ==================== */

export interface FunnelRow {
  stage: Stage;
  name: string;
  count: number;
  amount: number;
  weighted: number;
  color: string;
  conversionFromPrev: number | null;
}

export function buildFunnel(opps: Opportunity[], stageMeta: { code: Stage; name: string; color: string }[]): FunnelRow[] {
  const rows = stageMeta.map((s) => {
    const list = opps.filter((o) => o.stage === s.code);
    const amount = yuan(list.reduce((a, b) => a + b.amount, 0));
    const prob = s.code === 'S1' ? 10 : s.code === 'S2' ? 30 : s.code === 'S3' ? 60 : s.code === 'S4' ? 80 : 100;
    return {
      stage: s.code, name: s.name, count: list.length, amount,
      weighted: yuan(amount * (prob / 100)), color: s.color, conversionFromPrev: null as number | null,
    };
  });
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1].count;
    rows[i].conversionFromPrev = prev > 0 ? rows[i].count / prev : null;
  }
  return rows;
}

/* ==================== 业绩排行 ==================== */

export interface RankRow {
  userId: string;
  userName: string;
  dept: string;
  achieved: number;
  target: number;
  rate: number;
  orderCount: number;
}

export function buildRanking(db: Database): RankRow[] {
  return db.targets
    .map((t) => {
      const orders = db.orders.filter((o) => o.ownerId === t.userId);
      const achieved = yuan(t.achieved);
      return {
        userId: t.userId, userName: t.userName, dept: db.users.find((u) => u.id === t.userId)?.dept ?? '',
        achieved, target: t.amount,
        rate: t.amount > 0 ? achieved / t.amount : 0,
        orderCount: orders.length,
      };
    })
    .sort((a, b) => b.achieved - a.achieved);
}

/* ==================== 月度回款趋势 ==================== */

export function buildMonthlyPayments(db: Database, months: string[]): { month: string; amount: number }[] {
  return months.map((m) => ({
    month: m,
    amount: yuan(
      db.payments.filter((p) => p.status === 'CONFIRMED' && p.payDate.startsWith(m)).reduce((a, b) => a + b.amount, 0),
    ),
  }));
}

/* ==================== 线索来源分布 ==================== */

export function buildSourceDistribution(leads: Lead[]): { source: string; count: number; converted: number }[] {
  const map = new Map<string, { count: number; converted: number }>();
  for (const l of leads) {
    const cur = map.get(l.source) ?? { count: 0, converted: 0 };
    cur.count += 1;
    if (l.status === 'CONVERTED') cur.converted += 1;
    map.set(l.source, cur);
  }
  return [...map.entries()]
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.count - a.count);
}
