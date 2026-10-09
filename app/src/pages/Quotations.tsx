import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import {
  Card, Table, Th, Td, Badge, Button, Input, Select, Field, Drawer, EmptyState, Modal, Textarea, Stepper, Tabs,
} from '@/components/ui';
import { visibleQuotations, pendingMyApproval } from '@/store/selectors';
import {
  QUOTATION_STATUS, PAY_METHODS, DISCOUNT_NO_APPROVAL, DISCOUNT_TWO_LEVEL, AMOUNT_FORCE_TWO_LEVEL, ROLE_LABEL,
} from '@/config/businessRules';
import { money, percent, today, addDays, yuan } from '@/lib/format';
import type { Quotation, QuotationItem } from '@/types';

export default function Quotations() {
  const { db, user, submitQuotation, approveQuotation, withdrawQuotation, toast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [status, setStatus] = useState('');
  const [kw, setKw] = useState('');
  const [detail, setDetail] = useState<Quotation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ q: Quotation; action: 'APPROVED' | 'REJECTED' } | null>(null);
  const [comment, setComment] = useState('');

  const all = useMemo(() => visibleQuotations(db, user), [db, user]);
  const myApprovals = useMemo(() => pendingMyApproval(db, user), [db, user]);

  const list = useMemo(() => {
    let base = tab === 'approval' ? myApprovals : tab === 'mine' ? all.filter((q) => q.createdBy === user?.id) : all;
    if (status) base = base.filter((q) => q.status === status);
    if (kw) base = base.filter((q) => `${q.id}${q.customerName}${q.opportunityTitle}`.includes(kw));
    return base;
  }, [all, myApprovals, tab, status, kw, user]);

  const itemsOf = (id: string): QuotationItem[] => db.quotationItems.filter((i) => i.quotationId === id);

  const expired = (q: Quotation) => q.validUntil < today();

  return (
    <div>
      <PageHeader
        title="报价与审批"
        desc={`审批触发规则（FR-06-03）：折扣率 ≥ ${percent(DISCOUNT_NO_APPROVAL)} 需一级审批；≥ ${percent(DISCOUNT_TWO_LEVEL)} 或金额 ≥ ${money(AMOUNT_FORCE_TWO_LEVEL)} 需两级审批`}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}>+ 新建报价单</Button>}
      />

      <FilterBar>
        <Field label="关键词">
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="报价单号/客户/商机" className="w-52" />
        </Field>
        <Field label="状态">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
            <option value="">全部</option>
            {Object.entries(QUOTATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <div className="ml-auto">
          <Tabs
            items={[
              { key: 'all', label: `全部 (${all.length})` },
              { key: 'approval', label: `待我审批 (${myApprovals.length})` },
              { key: 'mine', label: '我创建的' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>
      </FilterBar>

      <Card dense>
        {list.length === 0 ? (
          <EmptyState text="没有符合条件的报价单" />
        ) : (
          <Table head={<>
            <Th>报价单号</Th><Th>客户 / 商机</Th><Th className="text-right">报价总额</Th>
            <Th className="text-right">折后金额</Th><Th>折扣率</Th><Th>审批链</Th><Th>状态</Th><Th>有效期</Th><Th>操作</Th>
          </>}>
            {list.map((q) => (
              <tr key={q.id} className="hover:bg-ink-50">
                <Td>
                  <div className="font-medium text-ink-900">{q.id}</div>
                  <div className="text-xs text-ink-400">{q.createdByName}</div>
                </Td>
                <Td>
                  <div>{q.customerName}</div>
                  <div className="max-w-[200px] truncate text-xs text-ink-400">{q.opportunityTitle}</div>
                </Td>
                <Td className="text-right num">¥{money(q.totalAmount)}</Td>
                <Td className="text-right num font-medium">¥{money(q.discountAmount)}</Td>
                <Td>
                  <Badge tone={q.discountRate >= DISCOUNT_TWO_LEVEL ? 'danger' : q.discountRate >= DISCOUNT_NO_APPROVAL ? 'warning' : 'neutral'}>
                    {(q.discountRate * 100).toFixed(1)}%
                  </Badge>
                </Td>
                <Td>
                  {q.approvalChain.length === 0
                    ? <span className="text-xs text-ink-400">无需审批</span>
                    : <div className="flex gap-1">
                        {q.approvalChain.map((s) => (
                          <span key={s.step} title={`${s.approverName}（${ROLE_LABEL[s.approverRole]}）`}>
                            <Badge tone={s.status === 'APPROVED' ? 'success' : s.status === 'REJECTED' ? 'danger' : 'warning'}>
                              {s.approverName}{s.status === 'APPROVED' ? '✓' : s.status === 'REJECTED' ? '✕' : '…'}
                            </Badge>
                          </span>
                        ))}
                      </div>}
                </Td>
                <Td>
                  <Badge tone={QUOTATION_STATUS[q.status].tone}>
                    {expired(q) && q.status !== 'CONVERTED' ? '已过期' : QUOTATION_STATUS[q.status].label}
                  </Badge>
                </Td>
                <Td className={expired(q) ? 'text-rose-600' : ''}>{q.validUntil}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(q)}>详情</Button>
                    {(q.status === 'DRAFT' || q.status === 'REJECTED') && q.createdBy === user?.id && (
                      <Button size="sm" variant="ghost" onClick={() => { const r = submitQuotation(q.id); if (!r.ok) toast(r.message, 'error'); }}>提交</Button>
                    )}
                    {q.status === 'APPROVING' && q.approvalChain.some((s) => s.approverId === user?.id && s.step === q.currentStep) && (
                      <>
                        <Button size="sm" variant="success" onClick={() => { setApproveTarget({ q, action: 'APPROVED' }); setComment(''); }}>通过</Button>
                        <Button size="sm" variant="danger" onClick={() => { setApproveTarget({ q, action: 'REJECTED' }); setComment(''); }}>驳回</Button>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <QuotationDrawer
        q={detail}
        items={detail ? itemsOf(detail.id) : []}
        onClose={() => setDetail(null)}
        onSubmit={() => { if (detail) { const r = submitQuotation(detail.id); if (!r.ok) toast(r.message, 'error'); setDetail(null); } }}
        onWithdraw={() => { if (detail) { withdrawQuotation(detail.id); setDetail(null); } }}
        onApprove={(action) => { if (detail) { setApproveTarget({ q: detail, action }); setComment(''); } }}
        onCreateOrder={(qid) => { setDetail(null); navigate(`/orders?from=${qid}`); }}
      />

      <CreateQuotationModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <Modal
        open={!!approveTarget}
        title={approveTarget?.action === 'APPROVED' ? '审批通过' : '审批驳回'}
        onClose={() => setApproveTarget(null)}
        width="max-w-md"
        footer={
          <>
            <Button onClick={() => setApproveTarget(null)}>取消</Button>
            <Button
              variant={approveTarget?.action === 'APPROVED' ? 'success' : 'danger'}
              onClick={() => {
                if (approveTarget) approveQuotation(approveTarget.q.id, approveTarget.action, comment);
                setApproveTarget(null);
              }}
            >
              确认
            </Button>
          </>
        }
      >
        <div className="mb-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
          报价单 {approveTarget?.q.id} · {approveTarget?.q.customerName} · 折后 ¥{money(approveTarget?.q.discountAmount ?? 0)}
        </div>
        <Field label="审批意见" required={approveTarget?.action === 'REJECTED'} hint={approveTarget?.action === 'REJECTED' ? '驳回必须填写意见' : '选填'}>
          <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="填写审批意见" />
        </Field>
      </Modal>
    </div>
  );
}

/* ==================== 报价详情抽屉 ==================== */

function QuotationDrawer({
  q, items, onClose, onSubmit, onWithdraw, onApprove, onCreateOrder,
}: {
  q: Quotation | null; items: QuotationItem[]; onClose: () => void;
  onSubmit: () => void; onWithdraw: () => void;
  onApprove: (action: 'APPROVED' | 'REJECTED') => void;
  onCreateOrder: (id: string) => void;
}) {
  const { user } = useApp();
  if (!q) return null;

  const myTurn = q.approvalChain.some((s) => s.approverId === user?.id && s.step === q.currentStep && s.status === 'PENDING');
  const expired = q.validUntil < today();

  const steps = [
    { title: '创建报价单', desc: `${q.createdByName} · ${q.createdAt}`, status: 'done' as const },
    ...q.approvalChain.map((s) => ({
      title: `${ROLE_LABEL[s.approverRole]} ${s.approverName}`,
      desc: s.comment || (s.status === 'PENDING' ? '等待处理' : ''),
      status: (s.status === 'APPROVED' ? 'done' : s.status === 'REJECTED' ? 'reject' : 'todo') as 'done' | 'reject' | 'todo',
      meta: s.at,
    })),
    { title: '生成合同订单', desc: q.status === 'CONVERTED' ? '已完成' : '待操作', status: (q.status === 'CONVERTED' ? 'done' : 'todo') as 'done' | 'todo' },
  ];

  return (
    <Drawer
      open={!!q}
      width="w-[680px]"
      title={<span>{q.id} <span className="ml-1 text-xs font-normal text-ink-400">{q.customerName}</span></span>}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>关闭</Button>
          {(q.status === 'DRAFT' || q.status === 'REJECTED') && q.createdBy === user?.id && (
            <Button variant="primary" onClick={onSubmit} disabled={expired}>提交审批</Button>
          )}
          {q.status === 'APPROVING' && q.createdBy === user?.id && <Button onClick={onWithdraw}>撤回</Button>}
          {myTurn && (
            <>
              <Button variant="success" onClick={() => onApprove('APPROVED')}>审批通过</Button>
              <Button variant="danger" onClick={() => onApprove('REJECTED')}>驳回</Button>
            </>
          )}
          {q.status === 'APPROVED' && !expired && (
            <Button variant="primary" onClick={() => onCreateOrder(q.id)}>生成合同订单</Button>
          )}
        </>
      }
    >
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">报价总额</div>
          <div className="mt-1 text-base font-semibold num">¥{money(q.totalAmount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">折后金额</div>
          <div className="mt-1 text-base font-semibold num text-brand-700">¥{money(q.discountAmount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">整体折扣率</div>
          <div className="mt-1 text-base font-semibold num">{(q.discountRate * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">有效期至</div>
          <div className={`mt-1 text-base font-semibold ${expired ? 'text-rose-600' : ''}`}>{q.validUntil}</div>
        </div>
      </div>

      {expired && q.status !== 'CONVERTED' && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          该报价单已超过有效期（BR-05），不可提交审批或生成订单，请修改有效期后重新提交。
        </div>
      )}

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-ink-800">产品明细</div>
        <Table head={<><Th>产品</Th><Th>规格</Th><Th className="text-right">单价</Th><Th className="text-right">数量</Th><Th className="text-right">折扣</Th><Th className="text-right">小计</Th><Th className="text-right">折后</Th></>}>
          {items.map((it) => (
            <tr key={it.id}>
              <Td>
                <div className="font-medium">{it.productName}</div>
                <div className="text-xs text-ink-400">{it.productId}</div>
              </Td>
              <Td className="text-xs">{it.spec}</Td>
              <Td className="text-right num">¥{money(it.price)}</Td>
              <Td className="text-right num">{it.quantity} {it.unit}</Td>
              <Td className="text-right num">{(it.discountRate * 100).toFixed(0)}%</Td>
              <Td className="text-right num">¥{money(it.subtotal)}</Td>
              <Td className="text-right num font-medium">¥{money(it.netAmount)}</Td>
            </tr>
          ))}
          <tr className="bg-ink-50 font-medium">
            <Td colSpan={5} className="text-right">合计</Td>
            <Td className="text-right num">¥{money(q.totalAmount)}</Td>
            <Td className="text-right num">¥{money(q.discountAmount)}</Td>
          </tr>
        </Table>
      </div>

      <div className="mb-4">
        <div className="mb-3 text-sm font-semibold text-ink-800">审批流程</div>
        <Stepper steps={steps} />
      </div>

      {q.remark && (
        <div className="rounded-md bg-ink-50 px-3 py-2.5 text-xs text-ink-600">
          <b>备注：</b>{q.remark}
        </div>
      )}
    </Drawer>
  );
}

/* ==================== 新建报价单 ==================== */

function CreateQuotationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, user, createQuotation, toast } = useApp();
  const myOpps = db.opportunities.filter((o) => o.status === 'OPEN' && o.ownerId === user?.id);
  const [oppId, setOppId] = useState(myOpps[0]?.id ?? '');
  const [validUntil, setValidUntil] = useState(addDays(today(), 30));
  const [payMethod, setPayMethod] = useState(PAY_METHODS[1]);
  const [remark, setRemark] = useState('');
  const [rows, setRows] = useState<{ productId: string; quantity: number; discountRate: number }[]>([
    { productId: db.products[0]?.id ?? '', quantity: 1, discountRate: 0 },
  ]);

  const calc = () => {
    let total = 0;
    let net = 0;
    for (const r of rows) {
      const p = db.products.find((x) => x.id === r.productId);
      if (!p) continue;
      const sub = p.price * r.quantity;
      total = yuan(total + sub);
      net = yuan(net + sub * (1 - r.discountRate));
    }
    return { total, net, rate: total > 0 ? 1 - net / total : 0 };
  };
  const { total, net, rate } = calc();

  const needTwo = rate >= DISCOUNT_TWO_LEVEL || net >= AMOUNT_FORCE_TWO_LEVEL;
  const needOne = rate >= DISCOUNT_NO_APPROVAL;
  const levelText = needTwo ? '需两级审批（销售经理 → 销售总监）' : needOne ? '需一级审批（销售经理）' : '无需审批，可直接定稿';

  const submit = () => {
    if (!oppId) { toast('请选择关联商机', 'error'); return; }
    if (rows.some((r) => !r.productId || r.quantity <= 0)) { toast('请完善产品明细', 'error'); return; }
    createQuotation({ opportunityId: oppId, validUntil, payMethod, remark, items: rows });
    onClose();
    setRows([{ productId: db.products[0]?.id ?? '', quantity: 1, discountRate: 0 }]);
    setRemark('');
  };

  return (
    <Modal
      open={open} title="新建报价单" onClose={onClose} width="max-w-3xl"
      footer={<><Button onClick={onClose}>取消</Button><Button variant="primary" onClick={submit}>创建报价单</Button></>}
    >
      <div className="grid grid-cols-3 gap-4">
        <Field label="关联商机" required>
          <Select value={oppId} onChange={(e) => setOppId(e.target.value)} disabled={myOpps.length === 0}>
            {myOpps.length === 0 ? <option>暂无进行中的商机</option> : myOpps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </Select>
        </Field>
        <Field label="报价有效期" required>
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} min={today()} />
        </Field>
        <Field label="付款方式">
          <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            {PAY_METHODS.map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Field>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-800">产品明细</span>
          <Button size="sm" onClick={() => setRows([...rows, { productId: db.products[0]?.id ?? '', quantity: 1, discountRate: 0 }])}>+ 添加行</Button>
        </div>
        <Table head={<><Th>产品</Th><Th className="text-right">标准单价</Th><Th className="text-right">数量</Th><Th className="text-right">行折扣率</Th><Th className="text-right">折后金额</Th><Th /></>}>
          {rows.map((r, i) => {
            const p = db.products.find((x) => x.id === r.productId);
            return (
              <tr key={i}>
                <Td>
                  <Select value={r.productId} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} className="w-56">
                    {db.products.filter((x) => x.status === 'ON_SALE').map((x) => (
                      <option key={x.id} value={x.id}>{x.name}（{x.spec}）</option>
                    ))}
                  </Select>
                </Td>
                <Td className="text-right num">¥{money(p?.price ?? 0)}</Td>
                <Td className="text-right">
                  <Input type="number" min={1} value={r.quantity} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} className="w-20 text-right" />
                </Td>
                <Td className="text-right">
                  <Input
                    type="number" min={0} max={100} step={1}
                    value={Math.round(r.discountRate * 100)}
                    onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, discountRate: Math.min(100, Math.max(0, Number(e.target.value))) / 100 } : x)))}
                    className="w-20 text-right"
                  />
                </Td>
                <Td className="text-right num">¥{money((p?.price ?? 0) * r.quantity * (1 - r.discountRate))}</Td>
                <Td>
                  <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={rows.length === 1}>删除</Button>
                </Td>
              </tr>
            );
          })}
        </Table>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 rounded-md bg-ink-50 p-3">
        <div><div className="text-xs text-ink-500">报价总额</div><div className="text-base font-semibold num">¥{money(total)}</div></div>
        <div><div className="text-xs text-ink-500">折后金额</div><div className="text-base font-semibold num text-brand-700">¥{money(net)}</div></div>
        <div><div className="text-xs text-ink-500">整体折扣率</div><div className="text-base font-semibold num">{(rate * 100).toFixed(1)}%</div></div>
        <div>
          <div className="text-xs text-ink-500">审批级别</div>
          <div className={`text-sm font-medium ${needTwo ? 'text-rose-600' : needOne ? 'text-amber-600' : 'text-emerald-600'}`}>{levelText}</div>
        </div>
      </div>

      <div className="mt-3">
        <Field label="备注"><Textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="报价说明、审批理由等" /></Field>
      </div>
    </Modal>
  );
}
