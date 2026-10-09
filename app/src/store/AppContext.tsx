/**
 * 全局应用状态与业务动作
 * 所有业务规则集中在此执行，页面组件只负责展示与调用
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type {
  Database, User, Lead, FollowUp, Customer, Opportunity, Stage, Quotation, QuotationItem,
  Order, PaymentPlan, Payment, Contact, Product,
} from '@/types';
import { buildSeedDb } from '@/data/seed';
import { loadDb, saveDb, clearDb, loadSession, saveSession, clearSession } from '@/lib/storage';
import { nextId, uid, primeCounter, resetCounters } from '@/lib/id';
import { yuan, today, now, addDays, sum } from '@/lib/format';
import {
  STAGE_MAP, DISCOUNT_NO_APPROVAL, DISCOUNT_TWO_LEVEL, AMOUNT_FORCE_TWO_LEVEL,
  PAY_PLAN_TEMPLATES, calcCustomerLevel,
} from '@/config/businessRules';

export interface ToastItem {
  id: number;
  tone: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppCtx {
  db: Database;
  user: User | null;
  toasts: ToastItem[];
  login: (username: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
  resetDemo: () => void;
  toast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: number) => void;

  /* 线索 */
  assignLeads: (ids: string[], ownerId: string) => void;
  addFollowUp: (input: Omit<FollowUp, 'id' | 'createdAt' | 'createdByName' | 'createdBy'>) => void;
  convertLead: (leadId: string, opt: { createOpportunity: boolean; opportunityTitle?: string; amount?: number }) => void;
  loseLead: (leadId: string, reason: string) => void;
  createLead: (input: Omit<Lead, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;

  /* 客户 */
  addContact: (c: Omit<Contact, 'id'>) => void;
  transferCustomer: (customerId: string, toUserId: string, withOpportunities: boolean) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;

  /* 商机 */
  createOpportunity: (input: Omit<Opportunity, 'id' | 'createdAt' | 'status' | 'stage' | 'probability' | 'ownerName' | 'customerName' | 'ownerId'>) => void;
  moveStage: (oppId: string, to: Stage, remark: string) => { ok: boolean; message: string };
  closeOpportunity: (oppId: string, result: 'WON' | 'LOST', payload: { reason?: string; competitor?: string; actualAmount?: number }) => void;

  /* 报价 */
  createQuotation: (input: {
    opportunityId: string; validUntil: string; payMethod: string; remark: string;
    items: { productId: string; quantity: number; discountRate: number }[];
  }) => void;
  submitQuotation: (id: string) => { ok: boolean; message: string };
  approveQuotation: (id: string, action: 'APPROVED' | 'REJECTED', comment: string) => void;
  withdrawQuotation: (id: string) => void;

  /* 订单 */
  createOrderFromQuotation: (quotationId: string, payload: { contractNo: string; signDate: string; deliveryDate?: string }) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  auditOrder: (orderId: string, pass: boolean, comment: string) => void;

  /* 回款 */
  registerPayment: (input: { planId: string; amount: number; method: Payment['method']; payDate: string; serialNo: string; remark: string }) => { ok: boolean; message: string };
  confirmPayment: (paymentId: string) => void;
  issueInvoice: (paymentId: string, invoiceNo: string) => void;

  /* 系统 */
  upsertUser: (u: User) => void;
  upsertProduct: (p: Product) => void;
  exportData: () => void;
  log: (action: string, target: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

function primeAll(db: Database): void {
  resetCounters();
  const map: [string, string[]][] = [
    ['L', db.leads.map((x) => x.id)],
    ['C', db.customers.map((x) => x.id)],
    ['O', db.opportunities.map((x) => x.id)],
    ['Q', db.quotations.map((x) => x.id)],
    ['SO', db.orders.map((x) => x.id)],
    ['PAY', db.payments.map((x) => x.id)],
  ];
  for (const [p, ids] of map) primeCounter(p, ids);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(() => {
    const existing = loadDb();
    if (existing) {
      primeAll(existing);
      return existing;
    }
    const seed = buildSeedDb();
    primeAll(seed);
    saveDb(seed);
    return seed;
  });

  const [userId, setUserId] = useState<string | null>(() => loadSession()?.userId ?? null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  const user = useMemo(() => db.users.find((u) => u.id === userId) ?? null, [db.users, userId]);

  const toast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** 统一的事务包装：修改 → 落盘 → 失败提示 */
  const commit = useCallback((mutator: (draft: Database) => void) => {
    setDb((prev) => {
      const draft: Database = { ...prev };
      mutator(draft);
      try {
        saveDb(draft);
      } catch (e) {
        window.setTimeout(() => toast(e instanceof Error ? e.message : String(e), 'error'), 0);
      }
      return draft;
    });
  }, [toast]);

  const log = useCallback((action: string, target: string) => {
    if (!user) return;
    commit((d) => {
      d.activityLogs = [
        { id: uid('AL'), actorId: user.id, actorName: user.name, action, target, at: now() },
        ...d.activityLogs,
      ].slice(0, 200);
    });
  }, [commit, user]);

  /* ==================== 登录 ==================== */

  const login = useCallback((username: string, password: string) => {
    const u = db.users.find((x) => x.username === username.trim());
    if (!u) return { ok: false, message: '账号不存在' };
    if (u.password !== password) return { ok: false, message: '密码错误' };
    if (u.status === 'DISABLED') return { ok: false, message: '该账号已被停用，请联系管理员' };
    setUserId(u.id);
    saveSession({ userId: u.id, loginAt: now() });
    return { ok: true, message: `欢迎回来，${u.name}` };
  }, [db.users]);

  const logout = useCallback(() => {
    setUserId(null);
    clearSession();
  }, []);

  const resetDemo = useCallback(() => {
    clearDb();
    const seed = buildSeedDb();
    primeAll(seed);
    saveDb(seed);
    setDb(seed);
    setUserId(null);
    clearSession();
    toast('已重置为演示数据', 'success');
  }, [toast]);

  /* ==================== 线索 ==================== */

  const createLead = useCallback<AppCtx['createLead']>((input) => {
    if (!user) return;
    const id = nextId('L');
    commit((d) => {
      d.leads = [{
        ...input, id, status: input.ownerId ? 'FOLLOWING' : 'NEW',
        createdBy: user.id, createdAt: now(),
      }, ...d.leads];
    });
    log('新增线索', `${id} ${input.companyName}`);
    toast(`线索 ${id} 创建成功`, 'success');
  }, [commit, log, toast, user]);

  const assignLeads = useCallback<AppCtx['assignLeads']>((ids, ownerId) => {
    if (!user) return;
    if (ids.length > 50) {
      toast('一次最多分配 50 条线索', 'error');
      return;
    }
    const owner = db.users.find((u) => u.id === ownerId);
    commit((d) => {
      d.leads = d.leads.map((l) =>
        ids.includes(l.id) && l.status === 'NEW'
          ? { ...l, ownerId, ownerName: owner?.name, status: 'FOLLOWING' as const }
          : l,
      );
    });
    log('批量分配线索', `${ids.length} 条 → ${owner?.name ?? ''}`);
    toast(`已分配 ${ids.length} 条线索给 ${owner?.name}`, 'success');
  }, [commit, db.users, log, toast, user]);

  const addFollowUp = useCallback<AppCtx['addFollowUp']>((input) => {
    if (!user) return;
    commit((d) => {
      d.followUps = [{
        ...input, id: uid('FU'), createdBy: user.id, createdByName: user.name, createdAt: now(),
      }, ...d.followUps];
      d.leads = d.leads.map((l) =>
        l.id === input.leadId
          ? { ...l, status: l.status === 'NEW' ? 'FOLLOWING' : l.status, nextFollowAt: input.nextFollowAt ?? l.nextFollowAt }
          : l,
      );
    });
    log('添加跟进记录', input.leadId);
    toast('跟进记录已保存', 'success');
  }, [commit, log, toast, user]);

  const convertLead = useCallback<AppCtx['convertLead']>((leadId, opt) => {
    if (!user) return;
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return;

    const existCustomer = db.customers.find((c) => c.name === lead.companyName);
    if (existCustomer) {
      toast(`客户「${lead.companyName}」已存在，请直接关联已有客户`, 'warning');
      return;
    }

    const customerId = nextId('C');
    commit((d) => {
      const customer: Customer = {
        id: customerId, name: lead.companyName, industry: lead.industry, level: 'C', levelAuto: true,
        source: lead.source, ownerId: lead.ownerId ?? user.id,
        ownerName: d.users.find((u) => u.id === (lead.ownerId ?? user.id))?.name ?? '',
        address: '', website: '', totalAmount: 0, createdAt: now(), leadId: lead.id,
      };
      d.customers = [customer, ...d.customers];
      d.contacts = [{
        id: uid('CT'), customerId, name: lead.contactName, title: '联系人',
        phone: lead.phone, email: '', isPrimary: true,
      }, ...d.contacts];
      d.leads = d.leads.map((l) =>
        l.id === leadId ? { ...l, status: 'CONVERTED' as const, convertedAt: now() } : l,
      );

      if (opt.createOpportunity) {
        const oppId = nextId('O');
        const amount = opt.amount ?? 0;
        d.opportunities = [{
          id: oppId, title: opt.opportunityTitle || `${lead.companyName} 采购项目`,
          customerId, customerName: lead.companyName, amount, stage: 'S1', probability: 10,
          expectedCloseDate: addDays(today(), 90), ownerId: customer.ownerId,
          ownerName: customer.ownerName, source: lead.source, status: 'OPEN',
          createdAt: now(), remark: `由线索 ${lead.id} 转化创建`,
        }, ...d.opportunities];
        d.stageHistories = [{
          id: uid('SH'), opportunityId: oppId, toStage: 'S1', operatorId: user.id,
          operatorName: user.name, remark: '线索转化创建商机', createdAt: now(),
        }, ...d.stageHistories];
      }
    });
    log('线索转化', `${leadId} → ${customerId}`);
    toast(`线索已转化为客户 ${customerId}${opt.createOpportunity ? '，并同步创建商机' : ''}`, 'success');
  }, [commit, db.customers, db.leads, db.users, log, toast, user]);

  const loseLead = useCallback<AppCtx['loseLead']>((leadId, reason) => {
    if (!user) return;
    if (!reason) {
      toast('废弃线索必须填写原因（BR-01）', 'error');
      return;
    }
    commit((d) => {
      d.leads = d.leads.map((l) => (l.id === leadId ? { ...l, status: 'LOST' as const, lostReason: reason } : l));
    });
    log('废弃线索', leadId);
    toast('线索已标记废弃', 'success');
  }, [commit, log, toast, user]);

  /* ==================== 客户 ==================== */

  const addContact = useCallback<AppCtx['addContact']>((c) => {
    commit((d) => {
      d.contacts = [
        { ...c, id: uid('CT') },
        ...(c.isPrimary ? d.contacts.map((x) => (x.customerId === c.customerId ? { ...x, isPrimary: false } : x)) : d.contacts),
      ];
    });
    toast('联系人已添加', 'success');
  }, [commit, toast]);

  const updateCustomer = useCallback<AppCtx['updateCustomer']>((id, patch) => {
    commit((d) => {
      d.customers = d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c));
    });
    toast('客户信息已更新', 'success');
  }, [commit, toast]);

  const transferCustomer = useCallback<AppCtx['transferCustomer']>((customerId, toUserId, withOpportunities) => {
    const target = db.users.find((u) => u.id === toUserId);
    commit((d) => {
      d.customers = d.customers.map((c) =>
        c.id === customerId ? { ...c, ownerId: toUserId, ownerName: target?.name ?? '' } : c,
      );
      if (withOpportunities) {
        d.opportunities = d.opportunities.map((o) =>
          o.customerId === customerId && o.status === 'OPEN'
            ? { ...o, ownerId: toUserId, ownerName: target?.name ?? '' }
            : o,
        );
      }
    });
    log('转移客户', `${customerId} → ${target?.name}`);
    toast(`客户已转移给 ${target?.name}`, 'success');
  }, [commit, db.users, log, toast]);

  /* ==================== 商机 ==================== */

  const createOpportunity = useCallback<AppCtx['createOpportunity']>((input) => {
    if (!user) return;
    const id = nextId('O');
    commit((d) => {
      d.opportunities = [{
        ...input, id, ownerId: user.id, stage: 'S1', probability: 10, status: 'OPEN',
        customerName: d.customers.find((c) => c.id === input.customerId)?.name ?? '',
        ownerName: user.name, createdAt: now(),
      }, ...d.opportunities];
      d.stageHistories = [{
        id: uid('SH'), opportunityId: id, toStage: 'S1', operatorId: user.id,
        operatorName: user.name, remark: '创建商机', createdAt: now(),
      }, ...d.stageHistories];
    });
    log('创建商机', `${id} ${input.title}`);
    toast(`商机 ${id} 创建成功`, 'success');
  }, [commit, log, toast, user]);

  /** 校验阶段推进前置条件（FR-05-01 / BR-03） */
  const moveStage = useCallback<AppCtx['moveStage']>((oppId, to, remark) => {
    if (!user) return { ok: false, message: '未登录' };
    const opp = db.opportunities.find((o) => o.id === oppId);
    if (!opp) return { ok: false, message: '商机不存在' };
    if (opp.status !== 'OPEN') return { ok: false, message: '商机已关闭，不可再推进阶段' };

    if (to === 'S3') {
      const hasQuote = db.quotations.some((q) => q.opportunityId === oppId);
      if (!hasQuote) return { ok: false, message: '不满足前置条件：进入「方案报价」阶段需至少创建 1 张报价单' };
    }
    if (to === 'S4') {
      const approved = db.quotations.some((q) => q.opportunityId === oppId && (q.status === 'APPROVED' || q.status === 'CONVERTED'));
      if (!approved) return { ok: false, message: '不满足前置条件：进入「商务谈判」阶段需存在审批通过的报价单' };
    }
    if (to === 'S5') {
      const signed = db.orders.some((o) => o.customerId === opp.customerId && o.status !== 'PENDING' && o.status !== 'CANCELLED');
      if (!signed) return { ok: false, message: '不满足前置条件：赢单需存在已签约的订单，请在订单模块完成商务审核' };
    }

    commit((d) => {
      d.opportunities = d.opportunities.map((o) =>
        o.id === oppId ? { ...o, stage: to, probability: STAGE_MAP[to].probability } : o,
      );
      d.stageHistories = [{
        id: uid('SH'), opportunityId: oppId, fromStage: opp.stage, toStage: to,
        operatorId: user.id, operatorName: user.name, remark, createdAt: now(),
      }, ...d.stageHistories];
    });
    log('推进商机阶段', `${oppId} → ${STAGE_MAP[to].name}`);
    toast(`商机已推进至「${STAGE_MAP[to].name}」`, 'success');
    return { ok: true, message: '' };
  }, [commit, db.opportunities, db.quotations, db.orders, log, toast, user]);

  const closeOpportunity = useCallback<AppCtx['closeOpportunity']>((oppId, result, payload) => {
    if (!user) return;
    if (result === 'LOST' && !payload.reason) {
      toast('输单必须填写输单原因（BR-08）', 'error');
      return;
    }
    commit((d) => {
      d.opportunities = d.opportunities.map((o) =>
        o.id === oppId
          ? {
              ...o, status: result,
              stage: result === 'WON' ? 'S5' : o.stage,
              probability: result === 'WON' ? 100 : 0,
              lostReason: payload.reason, competitor: payload.competitor,
              actualAmount: payload.actualAmount, closedAt: now(),
            }
          : o,
      );
      if (result === 'WON') {
        d.stageHistories = [{
          id: uid('SH'), opportunityId: oppId, fromStage: 'S4', toStage: 'S5',
          operatorId: user.id, operatorName: user.name, remark: '商机赢单', createdAt: now(),
        }, ...d.stageHistories];
      }
    });
    log(result === 'WON' ? '商机赢单' : '商机输单', oppId);
    toast(result === 'WON' ? '恭喜赢单！' : '商机已标记输单', result === 'WON' ? 'success' : 'info');
  }, [commit, log, toast, user]);

  /* ==================== 报价 ==================== */

  const buildApprovalChain = useCallback((discountRate: number, amount: number, d: Database) => {
    const needTwo = discountRate >= DISCOUNT_TWO_LEVEL || amount >= AMOUNT_FORCE_TWO_LEVEL;
    const needOne = discountRate >= DISCOUNT_NO_APPROVAL;
    if (!needOne && !needTwo) return [] as Quotation['approvalChain'];
    const manager = d.users.find((u) => u.role === 'MANAGER' && u.title === '销售经理') ?? d.users.find((u) => u.role === 'MANAGER');
    const director = d.users.find((u) => u.role === 'MANAGER' && u.title.includes('总监'));
    const chain: Quotation['approvalChain'] = [];
    if (manager) {
      chain.push({ step: 1, approverId: manager.id, approverName: manager.name, approverRole: manager.role, status: 'PENDING' });
    }
    if (needTwo && director && director.id !== manager?.id) {
      chain.push({ step: 2, approverId: director.id, approverName: director.name, approverRole: director.role, status: 'PENDING' });
    }
    return chain;
  }, []);

  const createQuotation = useCallback<AppCtx['createQuotation']>((input) => {
    if (!user) return;
    const opp = db.opportunities.find((o) => o.id === input.opportunityId);
    if (!opp) return;
    const id = nextId('Q');
    let total = 0;
    let net = 0;
    const items: QuotationItem[] = input.items.map((it) => {
      const p = db.products.find((x) => x.id === it.productId)!;
      const subtotal = yuan(p.price * it.quantity);
      const netAmount = yuan(subtotal * (1 - it.discountRate));
      total = yuan(total + subtotal);
      net = yuan(net + netAmount);
      return {
        id: uid('QI'), quotationId: id, productId: p.id, productName: p.name, spec: p.spec,
        unit: p.unit, price: p.price, quantity: it.quantity, discountRate: it.discountRate,
        subtotal, netAmount,
      };
    });
    const discountRate = total > 0 ? yuan(1 - net / total) : 0;

    commit((d) => {
      d.quotations = [{
        id, opportunityId: input.opportunityId, opportunityTitle: opp.title,
        customerId: opp.customerId, customerName: opp.customerName,
        totalAmount: total, discountAmount: net, discountRate,
        validUntil: input.validUntil, payMethod: input.payMethod, status: 'DRAFT',
        approvalChain: buildApprovalChain(discountRate, net, d), currentStep: 0,
        createdBy: user.id, createdByName: user.name, createdAt: now(), remark: input.remark,
      }, ...d.quotations];
      d.quotationItems = [...items, ...d.quotationItems];
    });
    log('创建报价单', `${id} 折扣率 ${(discountRate * 100).toFixed(1)}%`);
    toast(`报价单 ${id} 已创建，整体折扣率 ${(discountRate * 100).toFixed(1)}%`, 'success');
  }, [buildApprovalChain, commit, db.opportunities, db.products, log, toast, user]);

  const submitQuotation = useCallback<AppCtx['submitQuotation']>((id) => {
    if (!user) return { ok: false, message: '未登录' };
    const q = db.quotations.find((x) => x.id === id);
    if (!q) return { ok: false, message: '报价单不存在' };
    if (q.status !== 'DRAFT' && q.status !== 'REJECTED') return { ok: false, message: '当前状态不可提交审批' };
    if (q.validUntil < today()) return { ok: false, message: '报价已过期，请更新有效期后再提交' };
    if (q.approvalChain.length === 0) {
      commit((d) => {
        d.quotations = d.quotations.map((x) => (x.id === id ? { ...x, status: 'APPROVED' as const, currentStep: 0 } : x));
      });
      toast('折扣率低于 15%，无需审批，报价单已直接定稿', 'success');
      return { ok: true, message: '' };
    }
    commit((d) => {
      d.quotations = d.quotations.map((x) =>
        x.id === id
          ? {
              ...x, status: 'APPROVING' as const, currentStep: 1,
              approvalChain: x.approvalChain.map((s) => ({ ...s, status: 'PENDING' as const, comment: undefined, at: undefined })),
            }
          : x,
      );
      d.approvalRecords = [{
        id: uid('AR'), bizType: 'QUOTATION', bizId: id, step: 0, approverId: user.id,
        approverName: user.name, approverRole: user.role, action: 'SUBMITTED',
        comment: '提交审批', createdAt: now(),
      }, ...d.approvalRecords];
    });
    log('提交报价审批', id);
    toast(`已提交审批，等待 ${q.approvalChain[0]?.approverName ?? '审批人'} 处理`, 'success');
    return { ok: true, message: '' };
  }, [commit, db.quotations, log, toast, user]);

  const approveQuotation = useCallback<AppCtx['approveQuotation']>((id, action, comment) => {
    if (!user) return;
    if (action === 'REJECTED' && !comment.trim()) {
      toast('驳回必须填写审批意见', 'error');
      return;
    }
    const q = db.quotations.find((x) => x.id === id);
    if (!q) return;
    const step = q.currentStep;
    const myStep = q.approvalChain.find((s) => s.step === step);
    if (!myStep || myStep.approverId !== user.id) {
      toast('权限不足：当前审批层级不归您处理（NFR-S-02）', 'error');
      return;
    }

    commit((d) => {
      const chain = q.approvalChain.map((s) =>
        s.step === step ? { ...s, status: action, comment, at: now() } : s,
      );
      const isLast = step >= chain.length;
      const rejected = action === 'REJECTED';
      const nextStatus: Quotation['status'] = rejected
        ? 'REJECTED'
        : isLast ? 'APPROVED' : 'APPROVING';

      d.quotations = d.quotations.map((x) =>
        x.id === id
          ? { ...x, approvalChain: chain, status: nextStatus, currentStep: rejected || isLast ? step : step + 1 }
          : x,
      );
      d.approvalRecords = [{
        id: uid('AR'), bizType: 'QUOTATION', bizId: id, step, approverId: user.id,
        approverName: user.name, approverRole: user.role, action, comment, createdAt: now(),
      }, ...d.approvalRecords];

      // 报价通过 → 商机可自动推进至 S4（商务谈判）
      if (nextStatus === 'APPROVED') {
        const opp = d.opportunities.find((o) => o.id === q.opportunityId);
        if (opp && opp.status === 'OPEN' && opp.stage === 'S3') {
          d.opportunities = d.opportunities.map((o) =>
            o.id === opp.id ? { ...o, stage: 'S4' as const, probability: 80 } : o,
          );
          d.stageHistories = [{
            id: uid('SH'), opportunityId: opp.id, fromStage: 'S3', toStage: 'S4',
            operatorId: user.id, operatorName: user.name, remark: `报价单 ${id} 审批通过，自动推进`, createdAt: now(),
          }, ...d.stageHistories];
        }
      }
    });
    log(action === 'APPROVED' ? '报价审批通过' : '报价审批驳回', id);
    toast(action === 'APPROVED' ? '审批通过' : '已驳回，报价单退回创建人修改', action === 'APPROVED' ? 'success' : 'warning');
  }, [commit, db.quotations, log, toast, user]);

  const withdrawQuotation = useCallback<AppCtx['withdrawQuotation']>((id) => {
    if (!user) return;
    commit((d) => {
      d.quotations = d.quotations.map((x) =>
        x.id === id ? { ...x, status: 'DRAFT' as const, currentStep: 0, approvalChain: x.approvalChain.map((s) => ({ ...s, status: 'PENDING' as const })) } : x,
      );
    });
    toast('已撤回审批', 'info');
  }, [commit, toast, user]);

  /* ==================== 订单 ==================== */

  const recalcOrderPaid = (orderId: string, d: Database) => {
    const paid = yuan(d.payments.filter((p) => p.orderId === orderId && p.status === 'CONFIRMED').reduce((a, b) => a + b.amount, 0));
    d.orders = d.orders.map((o) => (o.id === orderId ? { ...o, paidAmount: paid } : o));
  };

  const createOrderFromQuotation = useCallback<AppCtx['createOrderFromQuotation']>((quotationId, payload) => {
    if (!user) return;
    const q = db.quotations.find((x) => x.id === quotationId);
    if (!q) return;
    if (q.status !== 'APPROVED') {
      toast('仅审批通过的报价单可生成订单', 'error');
      return;
    }
    if (q.validUntil < today()) {
      toast('该报价单已过期（BR-05），请重新出具报价', 'error');
      return;
    }
    const id = nextId('SO');
    commit((d) => {
      d.orders = [{
        id, quotationId, customerId: q.customerId, customerName: q.customerName,
        contractNo: payload.contractNo, amount: q.discountAmount, signDate: payload.signDate,
        deliveryDate: payload.deliveryDate, payMethod: q.payMethod, status: 'PENDING',
        paidAmount: 0, ownerId: user.id, ownerName: user.name, remark: `由报价单 ${quotationId} 生成`,
        createdAt: now(),
      }, ...d.orders];
      d.quotations = d.quotations.map((x) => (x.id === quotationId ? { ...x, status: 'CONVERTED' as const } : x));
    });
    log('生成合同订单', `${id} 来自 ${quotationId}`);
    toast(`订单 ${id} 已生成，请等待商务审核`, 'success');
  }, [commit, db.quotations, log, toast, user]);

  const auditOrder = useCallback<AppCtx['auditOrder']>((orderId, pass, comment) => {
    if (!user) return;
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return;
    if (user.role !== 'FINANCE') {
      toast('权限不足：仅商务财务可执行商务审核（NFR-S-02）', 'error');
      return;
    }
    if (order.status !== 'PENDING') {
      toast('仅待签约订单可审核', 'error');
      return;
    }
    const id = orderId;
    commit((d) => {
      d.orders = d.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status: pass ? ('SIGNED' as const) : ('CANCELLED' as const),
              auditBy: user.id, auditByName: user.name, auditAt: now(),
              remark: o.remark ? `${o.remark}；审核意见：${comment}` : `审核意见：${comment}`,
            }
          : o,
      );
      if (pass) {
        // FR-07-04：自动生成回款计划
        const tpl = PAY_PLAN_TEMPLATES[order.payMethod] ?? PAY_PLAN_TEMPLATES['三三四'];
        const plans: PaymentPlan[] = tpl.ratios.map((ratio, i) => ({
          id: `${id}-P${i + 1}`, orderId: id, orderNo: id, customerName: order.customerName,
          period: i + 1, planAmount: yuan(order.amount * ratio),
          planDate: addDays(order.signDate, tpl.offsets[i] ?? 30), paidAmount: 0, status: 'UNPAID',
        }));
        // 尾差调整：最后一期吸收舍入误差
        const allocated = yuan(plans.slice(0, -1).reduce((a, b) => a + b.planAmount, 0));
        plans[plans.length - 1].planAmount = yuan(order.amount - allocated);
        d.paymentPlans = [...plans, ...d.paymentPlans];
      }
    });
    log(pass ? '商务审核通过' : '商务审核驳回', id);
    toast(pass ? `订单已签约，系统自动生成 ${PAY_PLAN_TEMPLATES[order.payMethod]?.ratios.length ?? 3} 期回款计划` : '订单已驳回作废', pass ? 'success' : 'warning');
  }, [commit, db.orders, log, toast, user]);

  const updateOrderStatus = useCallback<AppCtx['updateOrderStatus']>((orderId, status) => {
    commit((d) => {
      d.orders = d.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    });
    toast('订单状态已更新', 'success');
  }, [commit, toast]);

  /* ==================== 回款 ==================== */

  const registerPayment = useCallback<AppCtx['registerPayment']>((input) => {
    if (!user) return { ok: false, message: '未登录' };
    const plan = db.paymentPlans.find((p) => p.id === input.planId);
    if (!plan) return { ok: false, message: '回款计划不存在' };
    const remain = yuan(plan.planAmount - plan.paidAmount);
    if (input.amount <= 0) return { ok: false, message: '回款金额必须大于 0' };
    if (input.amount > remain) {
      return { ok: false, message: `回款金额不得超过该期次剩余未回款金额 ${remain.toLocaleString()} 元（BR-06）` };
    }
    const id = nextId('PAY');
    commit((d) => {
      d.payments = [{
        id, orderId: plan.orderId, orderNo: plan.orderNo, planId: plan.id,
        customerName: plan.customerName, amount: input.amount, method: input.method,
        payDate: input.payDate, serialNo: input.serialNo, status: 'REGISTERED',
        invoiceNo: '', invoiceStatus: 'NONE', registeredBy: user.id, registeredByName: user.name,
        remark: input.remark,
      }, ...d.payments];
    });
    log('登记回款', `${id} ${input.amount.toLocaleString()} 元`);
    toast(`回款 ${id} 已登记，等待财务确认`, 'success');
    return { ok: true, message: '' };
  }, [commit, db.paymentPlans, log, toast, user]);

  const confirmPayment = useCallback<AppCtx['confirmPayment']>((paymentId) => {
    if (!user) return;
    if (user.role !== 'FINANCE') {
      toast('权限不足：仅商务财务可确认回款到账（NFR-S-02）', 'error');
      return;
    }
    const p = db.payments.find((x) => x.id === paymentId);
    if (!p) return;
    commit((d) => {
      d.payments = d.payments.map((x) =>
        x.id === paymentId ? { ...x, status: 'CONFIRMED' as const, confirmedBy: user.id, confirmedByName: user.name, confirmedAt: now() } : x,
      );
      // 重算计划状态（BR-07：未确认不计入）
      const plan = d.paymentPlans.find((pl) => pl.id === p.planId);
      if (plan) {
        const confirmed = d.payments.filter((x) => x.planId === plan.id && x.status === 'CONFIRMED');
        const paid = yuan(sum(confirmed.map((x) => x.amount)));
        const remain = yuan(plan.planAmount - paid);
        plan.paidAmount = paid;
        plan.status = remain <= 0 ? 'PAID' : paid > 0 ? (plan.planDate < today() ? 'OVERDUE' : 'PARTIAL') : (plan.planDate < today() ? 'OVERDUE' : 'UNPAID');
      }
      recalcOrderPaid(p.orderId, d);
      // 同步客户累计成交金额（BR-07）
      const order = d.orders.find((o) => o.id === p.orderId);
      if (order) {
        d.customers = d.customers.map((c) => (c.id === order.customerId ? { ...c, totalAmount: yuan(c.totalAmount + p.amount), level: c.levelAuto ? calcCustomerLevel(yuan(c.totalAmount + p.amount)) : c.level } : c));
      }
    });
    log('确认回款到账', paymentId);
    toast('回款已确认到账，统计口径同步更新', 'success');
  }, [commit, db.payments, log, toast, user]);

  const issueInvoice = useCallback<AppCtx['issueInvoice']>((paymentId, invoiceNo) => {
    if (!user) return;
    if (user.role !== 'FINANCE') {
      toast('权限不足：仅商务财务可开票', 'error');
      return;
    }
    if (!invoiceNo.trim()) {
      toast('请填写发票号', 'error');
      return;
    }
    commit((d) => {
      d.payments = d.payments.map((x) =>
        x.id === paymentId ? { ...x, invoiceNo, invoiceStatus: 'ISSUED' as const, invoiceDate: today() } : x,
      );
    });
    log('开具发票', `${paymentId} ${invoiceNo}`);
    toast('发票已开具', 'success');
  }, [commit, log, toast, user]);

  /* ==================== 系统管理 ==================== */

  const upsertUser = useCallback<AppCtx['upsertUser']>((u) => {
    commit((d) => {
      const exists = d.users.some((x) => x.id === u.id);
      d.users = exists ? d.users.map((x) => (x.id === u.id ? u : x)) : [...d.users, u];
    });
    toast('用户已保存', 'success');
  }, [commit, toast]);

  const upsertProduct = useCallback<AppCtx['upsertProduct']>((p) => {
    commit((d) => {
      const exists = d.products.some((x) => x.id === p.id);
      d.products = exists ? d.products.map((x) => (x.id === p.id ? p : x)) : [...d.products, p];
    });
    toast('产品已保存', 'success');
  }, [commit, toast]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesflow-data-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('数据已导出', 'success');
  }, [db, toast]);

  const value: AppCtx = {
    db, user, toasts, login, logout, resetDemo, toast, dismissToast,
    createLead, assignLeads, addFollowUp, convertLead, loseLead,
    addContact, transferCustomer, updateCustomer,
    createOpportunity, moveStage, closeOpportunity,
    createQuotation, submitQuotation, approveQuotation, withdrawQuotation,
    createOrderFromQuotation, updateOrderStatus, auditOrder,
    registerPayment, confirmPayment, issueInvoice,
    upsertUser, upsertProduct, exportData, log,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用');
  return ctx;
}
