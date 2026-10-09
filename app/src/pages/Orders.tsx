import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import {
  Card, Table, Th, Td, Badge, Button, Input, Select, Field, Drawer, EmptyState, Modal, Progress, Textarea,
} from '@/components/ui';
import { visibleOrders } from '@/store/selectors';
import { ORDER_STATUS, PAY_PLAN_TEMPLATES } from '@/config/businessRules';
import { money, moneyShort, today } from '@/lib/format';
import type { Order } from '@/types';

const NEXT_STATUS: Partial<Record<Order['status'], { to: Order['status']; label: string }>> = {
  SIGNED: { to: 'EXECUTING', label: '开始交付' },
  EXECUTING: { to: 'COMPLETED', label: '交付完成' },
};

export default function Orders() {
  const { db, user, auditOrder, updateOrderStatus } = useApp();
  const [params, setParams] = useSearchParams();
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(params.get('from') ? true : false);
  const [auditTarget, setAuditTarget] = useState<{ o: Order; pass: boolean } | null>(null);
  const [auditComment, setAuditComment] = useState('');

  const orders = useMemo(() => visibleOrders(db, user), [db, user]);
  const isFinance = user?.role === 'FINANCE';

  const filtered = useMemo(() => orders.filter((o) => {
    if (kw && !`${o.id}${o.customerName}${o.contractNo}`.includes(kw)) return false;
    if (status && o.status !== status) return false;
    return true;
  }), [orders, kw, status]);

  const plansOf = (id: string) => db.paymentPlans.filter((p) => p.orderId === id);
  const paymentsOf = (id: string) => db.payments.filter((p) => p.orderId === id);

  const presetQuote = params.get('from') ?? '';

  return (
    <div>
      <PageHeader
        title="合同订单"
        desc="报价审批通过后一键生成订单，商务审核通过即自动按付款方式拆分为分期回款计划（FR-07-04）"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}>+ 生成订单</Button>}
      />

      <div className="mb-4 grid grid-cols-5 gap-3">
        {(['PENDING', 'SIGNED', 'EXECUTING', 'COMPLETED', 'CANCELLED'] as const).map((s) => {
          const list = orders.filter((o) => o.status === s);
          return (
            <Card key={s} dense>
              <div className="p-3">
                <div className="text-xs text-ink-500">{ORDER_STATUS[s].label}</div>
                <div className="mt-1 text-xl font-semibold num">{list.length}</div>
                <div className="text-xs text-ink-500 num">¥{moneyShort(list.reduce((a, b) => a + b.amount, 0))}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <FilterBar>
        <Field label="关键词">
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="订单号/客户/合同号" className="w-52" />
        </Field>
        <Field label="状态">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
            <option value="">全部</option>
            {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Button onClick={() => { setKw(''); setStatus(''); }}>重置</Button>
        <div className="ml-auto text-xs text-ink-500">
          合同总额 ¥{moneyShort(orders.reduce((a, b) => a + b.amount, 0))} · 已回款 ¥{moneyShort(orders.reduce((a, b) => a + b.paidAmount, 0))}
        </div>
      </FilterBar>

      <Card dense>
        {filtered.length === 0 ? (
          <EmptyState text="没有符合条件的订单" />
        ) : (
          <Table head={<>
            <Th>订单编号 / 合同号</Th><Th>客户</Th><Th className="text-right">合同金额</Th>
            <Th className="text-right">已回款</Th><Th>回款进度</Th><Th>付款方式</Th><Th>状态</Th><Th>签订日期</Th><Th>操作</Th>
          </>}>
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-ink-50">
                <Td>
                  <div className="font-medium text-ink-900">{o.id}</div>
                  <div className="text-xs text-ink-400">{o.contractNo || '暂无合同号'}</div>
                </Td>
                <Td>{o.customerName}</Td>
                <Td className="text-right num">¥{money(o.amount)}</Td>
                <Td className="text-right num">¥{money(o.paidAmount)}</Td>
                <Td className="w-40">
                  <Progress value={o.amount > 0 ? o.paidAmount / o.amount : 0} tone={o.paidAmount >= o.amount ? 'success' : 'primary'} showText />
                </Td>
                <Td>{o.payMethod}</Td>
                <Td><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></Td>
                <Td>{o.signDate}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(o)}>详情</Button>
                    {isFinance && o.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => { setAuditTarget({ o, pass: true }); setAuditComment(''); }}>审核</Button>
                        <Button size="sm" variant="danger" onClick={() => { setAuditTarget({ o, pass: false }); setAuditComment(''); }}>驳回</Button>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <OrderDrawer
        order={detail}
        plans={detail ? plansOf(detail.id) : []}
        payments={detail ? paymentsOf(detail.id) : []}
        quotation={detail ? db.quotations.find((q) => q.id === detail.quotationId) : undefined}
        onClose={() => setDetail(null)}
        onAdvance={() => {
          if (!detail) return;
          const next = NEXT_STATUS[detail.status];
          if (next) { updateOrderStatus(detail.id, next.to); setDetail(null); }
        }}
        onAudit={(pass) => { if (detail) { setAuditTarget({ o: detail, pass }); setAuditComment(''); } }}
      />

      <CreateOrderModal
        open={createOpen}
        presetQuote={presetQuote}
        onClose={() => { setCreateOpen(false); if (params.get('from')) setParams({}); }}
      />

      <Modal
        open={!!auditTarget}
        title={auditTarget?.pass ? '商务审核通过' : '商务审核驳回'}
        onClose={() => setAuditTarget(null)}
        width="max-w-md"
        footer={<>
          <Button onClick={() => setAuditTarget(null)}>取消</Button>
          <Button
            variant={auditTarget?.pass ? 'success' : 'danger'}
            onClick={() => {
              if (auditTarget) auditOrder(auditTarget.o.id, auditTarget.pass, auditComment || (auditTarget.pass ? '合同条款审核通过' : '合同条款需修改'));
              setAuditTarget(null); setDetail(null);
            }}
          >确认</Button>
        </>}
      >
        <div className="mb-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
          订单 {auditTarget?.o.id} · {auditTarget?.o.customerName} · ¥{money(auditTarget?.o.amount ?? 0)}
        </div>
        {auditTarget?.pass && (
          <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            审核通过后将自动生成回款计划：
            {PAY_PLAN_TEMPLATES[auditTarget.o.payMethod]?.ratios.map((r, i) => (
              <span key={i}> 第 {i + 1} 期 {(r * 100).toFixed(0)}%（¥{money(auditTarget.o.amount * r)}）</span>
            ))}
          </div>
        )}
        <Field label="审核意见" required={!auditTarget?.pass}>
          <Textarea rows={3} value={auditComment} onChange={(e) => setAuditComment(e.target.value)} placeholder="填写审核意见" />
        </Field>
      </Modal>
    </div>
  );
}

/* ==================== 订单详情 ==================== */

function OrderDrawer({
  order, plans, payments, quotation, onClose, onAdvance, onAudit,
}: {
  order: Order | null;
  plans: import('@/types').PaymentPlan[];
  payments: import('@/types').Payment[];
  quotation?: import('@/types').Quotation;
  onClose: () => void; onAdvance: () => void; onAudit: (pass: boolean) => void;
}) {
  const { user, toast } = useApp();
  if (!order) return null;
  const isFinance = user?.role === 'FINANCE';
  const next = NEXT_STATUS[order.status];

  return (
    <Drawer
      open={!!order}
      width="w-[680px]"
      title={<span>{order.id} <span className="ml-1 text-xs font-normal text-ink-400">{order.customerName}</span></span>}
      onClose={onClose}
      footer={<>
        <Button onClick={onClose}>关闭</Button>
        {isFinance && order.status === 'PENDING' && (
          <>
            <Button variant="success" onClick={() => onAudit(true)}>审核通过</Button>
            <Button variant="danger" onClick={() => onAudit(false)}>驳回</Button>
          </>
        )}
        {next && !isFinance && <Button variant="primary" onClick={onAdvance}>{next.label}</Button>}
        {next && isFinance && (
          <Button onClick={() => toast('订单交付状态由销售或项目经理推进', 'info')}>{next.label}</Button>
        )}
      </>}
    >
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">合同金额</div>
          <div className="mt-1 text-base font-semibold num">¥{money(order.amount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">已回款</div>
          <div className="mt-1 text-base font-semibold num text-emerald-600">¥{money(order.paidAmount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">待回款</div>
          <div className="mt-1 text-base font-semibold num text-amber-600">¥{money(order.amount - order.paidAmount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">付款方式</div>
          <div className="mt-1 text-base font-semibold">{order.payMethod}</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <Row label="合同编号" value={order.contractNo || '-'} />
        <Row label="签订日期" value={order.signDate} />
        <Row label="交付日期" value={order.deliveryDate ?? '-'} />
        <Row label="归属销售" value={order.ownerName} />
        <Row label="来源报价单" value={quotation ? `${quotation.id}（折扣 ${(quotation.discountRate * 100).toFixed(1)}%）` : '手工创建'} />
        <Row label="商务审核" value={order.auditByName ? `${order.auditByName} · ${order.auditAt}` : '未审核'} />
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-ink-800">回款计划（{plans.length} 期）</div>
        {plans.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink-300 px-3 py-5 text-center text-xs text-ink-400">
            订单尚未签约，商务审核通过后自动生成回款计划
          </div>
        ) : (
          <Table head={<><Th>期次</Th><Th className="text-right">计划金额</Th><Th>计划日期</Th><Th className="text-right">已回款</Th><Th>状态</Th></>}>
            {plans.map((p) => (
              <tr key={p.id}>
                <Td>第 {p.period} 期</Td>
                <Td className="text-right num">¥{money(p.planAmount)}</Td>
                <Td className={p.planDate < today() && p.status !== 'PAID' ? 'text-rose-600' : ''}>{p.planDate}</Td>
                <Td className="text-right num">¥{money(p.paidAmount)}</Td>
                <Td>
                  <Badge tone={p.status === 'PAID' ? 'success' : p.status === 'OVERDUE' ? 'danger' : p.status === 'PARTIAL' ? 'warning' : 'neutral'}>
                    {p.status === 'PAID' ? '已回款' : p.status === 'OVERDUE' ? '逾期' : p.status === 'PARTIAL' ? '部分回款' : '未回款'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-ink-800">回款记录（{payments.length}）</div>
        {payments.length === 0 ? (
          <EmptyState text="暂无回款记录" />
        ) : (
          <Table head={<><Th>回款编号</Th><Th className="text-right">金额</Th><Th>方式</Th><Th>日期</Th><Th>状态</Th><Th>发票号</Th></>}>
            {payments.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.id}</Td>
                <Td className="text-right num">¥{money(p.amount)}</Td>
                <Td>{p.method}</Td>
                <Td>{p.payDate}</Td>
                <Td><Badge tone={p.status === 'CONFIRMED' ? 'success' : 'warning'}>{p.status === 'CONFIRMED' ? '已确认' : '待确认'}</Badge></Td>
                <Td>{p.invoiceNo || '-'}</Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-20 shrink-0 text-ink-500">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  );
}

/* ==================== 生成订单 ==================== */

function CreateOrderModal({ open, presetQuote, onClose }: { open: boolean; presetQuote: string; onClose: () => void }) {
  const { db, user, createOrderFromQuotation } = useApp();
  const approved = db.quotations.filter((q) => q.status === 'APPROVED' && q.validUntil >= today() && q.createdBy === user?.id);
  const [quoteId, setQuoteId] = useState(presetQuote || approved[0]?.id || '');
  const [contractNo, setContractNo] = useState('');
  const [signDate, setSignDate] = useState(today());
  const [deliveryDate, setDeliveryDate] = useState('');

  const q = db.quotations.find((x) => x.id === quoteId);

  return (
    <Modal
      open={open} title="生成合同订单" onClose={onClose} width="max-w-xl"
      footer={<><Button onClick={onClose}>取消</Button>
        <Button variant="primary" disabled={!quoteId} onClick={() => {
          createOrderFromQuotation(quoteId, { contractNo, signDate, deliveryDate: deliveryDate || undefined });
          setContractNo(''); onClose();
        }}>生成订单</Button></>}
    >
      {approved.length === 0 ? (
        <div className="rounded-md bg-amber-50 px-3 py-3 text-xs text-amber-800">
          您名下暂无可生成订单的报价单。生成订单需满足：报价单状态为「已通过」且在有效期内。
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="来源报价单" required>
            <Select value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
              {approved.map((x) => (
                <option key={x.id} value={x.id}>{x.id} · {x.customerName} · ¥{money(x.discountAmount)}</option>
              ))}
            </Select>
          </Field>
          {q && (
            <div className="grid grid-cols-3 gap-3 rounded-md bg-ink-50 p-3 text-xs">
              <div><span className="text-ink-500">客户：</span>{q.customerName}</div>
              <div><span className="text-ink-500">折后金额：</span>¥{money(q.discountAmount)}</div>
              <div><span className="text-ink-500">付款方式：</span>{q.payMethod}</div>
              <div><span className="text-ink-500">报价总额：</span>¥{money(q.totalAmount)}</div>
              <div><span className="text-ink-500">折扣率：</span>{(q.discountRate * 100).toFixed(1)}%</div>
              <div><span className="text-ink-500">有效期：</span>{q.validUntil}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="合同编号"><Input value={contractNo} onChange={(e) => setContractNo(e.target.value)} placeholder="如 HT-2026-0001" /></Field>
            <Field label="签订日期" required><Input type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)} /></Field>
            <Field label="交付日期"><Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></Field>
          </div>
          <div className="rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-800">
            订单生成后状态为「待签约」，需商务财务审核通过方可签约并自动生成回款计划。
          </div>
        </div>
      )}
    </Modal>
  );
}
