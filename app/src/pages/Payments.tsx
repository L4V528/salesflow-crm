import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import {
  Card, Table, Th, Td, Badge, Button, Input, Select, Field, Modal, EmptyState, Tabs, StatCard, Progress, Textarea,
} from '@/components/ui';
import { visiblePlans, visibleOrders } from '@/store/selectors';
import { PLAN_STATUS, PAYMENT_STATUS, INVOICE_STATUS, PAY_METHODS_PAYMENT } from '@/config/businessRules';
import { money, moneyShort, today } from '@/lib/format';
import type { PaymentPlan, Payment, PayMethod } from '@/types';

export default function Payments() {
  const { db, user, registerPayment, confirmPayment, issueInvoice, toast } = useApp();
  const [tab, setTab] = useState('plan');
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('');
  const [registerTarget, setRegisterTarget] = useState<PaymentPlan | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Payment | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');

  const plans = useMemo(() => visiblePlans(db, user), [db, user]);
  const orders = useMemo(() => visibleOrders(db, user), [db, user]);
  const orderIds = useMemo(() => new Set(orders.map((o) => o.id)), [orders]);
  const payments = useMemo(() => db.payments.filter((p) => orderIds.has(p.orderId)), [db.payments, orderIds]);

  const isFinance = user?.role === 'FINANCE';

  const overdue = plans.filter((p) => p.status === 'OVERDUE');
  const totalPlan = plans.reduce((a, b) => a + b.planAmount, 0);
  const totalPaid = plans.reduce((a, b) => a + b.paidAmount, 0);
  const totalUnpaid = totalPlan - totalPaid;

  const filteredPlans = useMemo(() => plans.filter((p) => {
    if (kw && !`${p.customerName}${p.orderNo}`.includes(kw)) return false;
    if (status && p.status !== status) return false;
    return true;
  }), [plans, kw, status]);

  return (
    <div>
      <PageHeader
        title="回款管理"
        desc="分期计划自动生成，回款登记后需财务确认到账才计入统计（BR-07），逾期实时预警"
      />

      <div className="mb-4 grid grid-cols-4 gap-4">
        <StatCard label="计划回款总额" value={`¥${moneyShort(totalPlan)}`} sub={`共 ${plans.length} 个期次`} tone="info" icon="◈" />
        <StatCard label="已回款" value={`¥${moneyShort(totalPaid)}`} sub={`回款率 ${totalPlan > 0 ? ((totalPaid / totalPlan) * 100).toFixed(1) : '0.0'}%`} tone="success" icon="✓" />
        <StatCard label="待回款" value={`¥${moneyShort(totalUnpaid)}`} sub={`${plans.filter((p) => p.status !== 'PAID').length} 个期次未完成`} tone="warning" icon="◷" />
        <StatCard
          label="逾期期次"
          value={overdue.length}
          sub={`逾期金额 ¥${moneyShort(overdue.reduce((a, b) => a + (b.planAmount - b.paidAmount), 0))}`}
          tone={overdue.length > 0 ? 'danger' : 'success'}
          icon="!"
          onClick={() => { setTab('plan'); setStatus('OVERDUE'); }}
        />
      </div>

      <FilterBar>
        <Field label="关键词">
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="客户/订单号" className="w-48" />
        </Field>
        <Field label="状态">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
            <option value="">全部</option>
            {Object.entries(PLAN_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Button onClick={() => { setKw(''); setStatus(''); }}>重置</Button>
        <div className="ml-auto">
          <Tabs
            items={[{ key: 'plan', label: '回款计划' }, { key: 'record', label: `回款记录 (${payments.length})` }]}
            active={tab}
            onChange={setTab}
          />
        </div>
      </FilterBar>

      {tab === 'plan' ? (
        <Card dense>
          {filteredPlans.length === 0 ? (
            <EmptyState text="没有符合条件的回款计划" />
          ) : (
            <Table head={<>
              <Th>订单 / 客户</Th><Th>期次</Th><Th className="text-right">计划金额</Th><Th>计划日期</Th>
              <Th className="text-right">已回款</Th><Th>回款进度</Th><Th>状态</Th><Th>操作</Th>
            </>}>
              {filteredPlans.map((p) => {
                const remain = p.planAmount - p.paidAmount;
                return (
                  <tr key={p.id} className={p.status === 'OVERDUE' ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-ink-50'}>
                    <Td>
                      <div className="font-medium text-ink-900">{p.customerName}</div>
                      <div className="text-xs text-ink-400">{p.orderNo}</div>
                    </Td>
                    <Td>第 {p.period} 期</Td>
                    <Td className="text-right num">¥{money(p.planAmount)}</Td>
                    <Td className={p.planDate < today() && p.status !== 'PAID' ? 'font-medium text-rose-600' : ''}>
                      {p.planDate}
                      {p.planDate < today() && p.status !== 'PAID' && <span className="ml-1 text-xs">已逾期</span>}
                    </Td>
                    <Td className="text-right num">¥{money(p.paidAmount)}</Td>
                    <Td className="w-36"><Progress value={p.planAmount > 0 ? p.paidAmount / p.planAmount : 0} tone={p.status === 'OVERDUE' ? 'danger' : p.status === 'PAID' ? 'success' : 'primary'} showText /></Td>
                    <Td><Badge tone={PLAN_STATUS[p.status].tone}>{PLAN_STATUS[p.status].label}</Badge></Td>
                    <Td>
                      {remain > 0 ? (
                        <Button size="sm" variant="primary" onClick={() => setRegisterTarget(p)}>登记回款</Button>
                      ) : (
                        <span className="text-xs text-ink-400">已完成</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      ) : (
        <Card dense>
          {payments.length === 0 ? (
            <EmptyState text="暂无回款记录" />
          ) : (
            <Table head={<>
              <Th>回款编号</Th><Th>客户 / 订单</Th><Th className="text-right">金额</Th><Th>方式</Th>
              <Th>回款日期</Th><Th>流水号</Th><Th>状态</Th><Th>发票</Th><Th>操作</Th>
            </>}>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <Td className="font-medium">{p.id}</Td>
                  <Td>
                    <div>{p.customerName}</div>
                    <div className="text-xs text-ink-400">{p.orderNo}</div>
                  </Td>
                  <Td className="text-right num">¥{money(p.amount)}</Td>
                  <Td>{p.method}</Td>
                  <Td>{p.payDate}</Td>
                  <Td className="text-xs">{p.serialNo || '-'}</Td>
                  <Td>
                    <Badge tone={PAYMENT_STATUS[p.status].tone}>
                      {p.status === 'CONFIRMED' ? '已确认' : '待确认'}
                    </Badge>
                    {p.status === 'CONFIRMED' && <div className="mt-0.5 text-[11px] text-ink-400">{p.confirmedByName}</div>}
                  </Td>
                  <Td><Badge tone={INVOICE_STATUS[p.invoiceStatus].tone}>{INVOICE_STATUS[p.invoiceStatus].label}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      {isFinance && p.status === 'REGISTERED' && (
                        <Button size="sm" variant="success" onClick={() => confirmPayment(p.id)}>确认到账</Button>
                      )}
                      {isFinance && p.status === 'CONFIRMED' && p.invoiceStatus === 'NONE' && (
                        <Button size="sm" variant="ghost" onClick={() => { setInvoiceTarget(p); setInvoiceNo(''); }}>开票</Button>
                      )}
                      {!isFinance && p.status === 'REGISTERED' && <span className="text-xs text-ink-400">待财务确认</span>}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {!isFinance && (
        <div className="mt-4 rounded-md bg-ink-50 px-4 py-3 text-xs text-ink-500">
          提示：销售员登记回款后状态为「待确认」，需商务财务确认到账后才计入订单已回款金额与客户累计成交金额（BR-07）。
          如需演示确认流程，请使用商务财务账号（王芳 / wangfang）登录。
        </div>
      )}

      <RegisterPaymentModal
        plan={registerTarget}
        onClose={() => setRegisterTarget(null)}
        onConfirm={(input) => {
          const r = registerPayment(input);
          if (!r.ok) toast(r.message, 'error');
          else setRegisterTarget(null);
        }}
      />

      <Modal
        open={!!invoiceTarget}
        title="开具发票"
        onClose={() => setInvoiceTarget(null)}
        width="max-w-md"
        footer={<><Button onClick={() => setInvoiceTarget(null)}>取消</Button>
          <Button variant="primary" onClick={() => { if (invoiceTarget) issueInvoice(invoiceTarget.id, invoiceNo); setInvoiceTarget(null); }}>确认开票</Button></>}
      >
        <div className="mb-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
          回款 {invoiceTarget?.id} · ¥{money(invoiceTarget?.amount ?? 0)} · {invoiceTarget?.customerName}
        </div>
        <Field label="发票号" required>
          <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="如 02658903" />
        </Field>
      </Modal>
    </div>
  );
}

/* ==================== 登记回款 ==================== */

function RegisterPaymentModal({
  plan, onClose, onConfirm,
}: {
  plan: PaymentPlan | null;
  onClose: () => void;
  onConfirm: (input: { planId: string; amount: number; method: PayMethod; payDate: string; serialNo: string; remark: string }) => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('电汇');
  const [payDate, setPayDate] = useState(today());
  const [serialNo, setSerialNo] = useState('');
  const [remark, setRemark] = useState('');

  if (!plan) return null;
  const remain = plan.planAmount - plan.paidAmount;

  return (
    <Modal
      open={!!plan}
      title={`登记回款：${plan.customerName} 第 ${plan.period} 期`}
      onClose={onClose}
      width="max-w-lg"
      footer={<><Button onClick={onClose}>取消</Button>
        <Button variant="primary" onClick={() => onConfirm({ planId: plan.id, amount: Number(amount), method, payDate, serialNo, remark })}>提交登记</Button></>}
    >
      <div className="mb-3 grid grid-cols-3 gap-3 rounded-md bg-ink-50 p-3 text-xs">
        <div><span className="text-ink-500">计划金额：</span>¥{money(plan.planAmount)}</div>
        <div><span className="text-ink-500">已回款：</span>¥{money(plan.paidAmount)}</div>
        <div><span className="text-ink-500">剩余未回款：</span><b className="text-amber-700">¥{money(remain)}</b></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="回款金额（元）" required hint={`不得超过剩余未回款金额（BR-06）`}>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(remain)} />
        </Field>
        <Field label="回款方式" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
            {PAY_METHODS_PAYMENT.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="回款日期" required>
          <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        </Field>
        <Field label="流水号">
          <Input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} placeholder="银行流水/票据号" />
        </Field>
        <div className="col-span-2">
          <Field label="备注"><Textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} /></Field>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
        登记后状态为「待确认」，需商务财务确认到账后才计入统计口径。
      </div>
    </Modal>
  );
}
