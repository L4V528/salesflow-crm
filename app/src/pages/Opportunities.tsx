import React, { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import {
  Card, Badge, Button, Input, Select, Field, Drawer, EmptyState, Modal, Tabs, Textarea,
} from '@/components/ui';
import { visibleOpportunities } from '@/store/selectors';
import { STAGES, STAGE_MAP, LOST_REASONS } from '@/config/businessRules';
import { money, moneyShort, today, addDays } from '@/lib/format';
import type { Opportunity, Stage, Customer } from '@/types';

export default function Opportunities() {
  const { db, user, moveStage, closeOpportunity, createOpportunity, toast } = useApp();
  const [view, setView] = useState('board');
  const [kw, setKw] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [detail, setDetail] = useState<Opportunity | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<{ opp: Opportunity; result: 'WON' | 'LOST' } | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const opps = useMemo(() => visibleOpportunities(db, user), [db, user]);
  const openOpps = useMemo(() => opps.filter((o) => o.status === 'OPEN'), [opps]);

  const filtered = useMemo(() => openOpps.filter((o) => {
    if (kw && !`${o.title}${o.customerName}${o.id}`.includes(kw)) return false;
    if (ownerFilter && o.ownerId !== ownerFilter) return false;
    return true;
  }), [openOpps, kw, ownerFilter]);

  const byStage = (s: Stage) => filtered.filter((o) => o.stage === s);

  const handleDrop = (to: Stage) => {
    setDragOver(null);
    const id = draggingRef.current;
    draggingRef.current = null;
    if (!id) return;
    const opp = opps.find((o) => o.id === id);
    if (!opp || opp.stage === to) return;
    const r = moveStage(id, to, `看板拖拽推进至 ${STAGE_MAP[to].name}`);
    if (!r.ok) toast(r.message, 'error');
  };

  const draggingRef = React.useRef<string | null>(null);

  const closed = opps.filter((o) => o.status !== 'OPEN');

  return (
    <div>
      <PageHeader
        title="商机看板"
        desc="五阶段状态机驱动，拖拽推进时自动校验前置条件；加权金额 = 商机金额 × 阶段赢率"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}>+ 新建商机</Button>}
      />

      {/* 阶段汇总 */}
      <div className="mb-4 grid grid-cols-5 gap-3">
        {STAGES.map((s) => {
          const list = byStage(s.code);
          const amount = list.reduce((a, b) => a + b.amount, 0);
          return (
            <Card key={s.code} dense>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-600">{s.code} {s.name}</span>
                  <span className="text-xs text-ink-400 num">{s.probability}%</span>
                </div>
                <div className="mt-1.5 text-xl font-semibold num">{list.length}</div>
                <div className="text-xs text-ink-500 num">¥{moneyShort(amount)}</div>
                <div className="mt-1.5 text-[11px] text-ink-400 num">加权 ¥{moneyShort(amount * s.probability / 100)}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <FilterBar>
        <Field label="关键词">
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="商机标题/客户/编号" className="w-52" />
        </Field>
        <Field label="负责人">
          <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="w-36">
            <option value="">全部</option>
            {db.users.filter((u) => u.role === 'SALES' || u.role === 'MANAGER').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <div className="ml-auto">
          <Tabs
            items={[{ key: 'board', label: '看板视图' }, { key: 'closed', label: `已关闭 (${closed.length})` }]}
            active={view}
            onChange={setView}
          />
        </div>
      </FilterBar>

      {view === 'board' ? (
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map((s) => (
            <div
              key={s.code}
              onDragOver={(e) => { e.preventDefault(); setDragOver(s.code); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(s.code)}
              className={`min-h-[420px] rounded-lg border-2 p-2 transition ${
                dragOver === s.code ? 'border-brand-400 bg-brand-50/50' : 'border-transparent bg-ink-100'
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.code} {s.name}
                </span>
                <span className="rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-500 num">{byStage(s.code).length}</span>
              </div>

              <div className="space-y-2">
                {byStage(s.code).map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={() => { draggingRef.current = o.id; }}
                    onDragEnd={() => { draggingRef.current = null; setDragOver(null); }}
                    onClick={() => setDetail(o)}
                    className="cursor-grab rounded-md border border-ink-200 bg-white p-2.5 shadow-card transition hover:border-brand-300 hover:shadow-pop active:cursor-grabbing"
                  >
                    <div className="text-sm font-medium leading-snug text-ink-900">{o.title}</div>
                    <div className="mt-1 text-xs text-ink-500">{o.customerName}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold num text-ink-900">¥{moneyShort(o.amount)}</span>
                      <span className="text-[11px] text-ink-400">{o.ownerName}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-400">
                      <span>预计 {o.expectedCloseDate}</span>
                      {o.expectedCloseDate < today() && <span className="text-rose-500">已逾期</span>}
                    </div>
                  </div>
                ))}
                {byStage(s.code).length === 0 && (
                  <div className="rounded-md border border-dashed border-ink-300 py-8 text-center text-xs text-ink-400">
                    拖拽商机到此
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card dense>
          {closed.length === 0 ? (
            <EmptyState text="暂无已关闭商机" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold text-ink-600">
                  <th className="px-3 py-2.5">商机</th><th>客户</th><th className="text-right">金额</th>
                  <th>结果</th><th>原因</th><th>竞品</th><th>负责人</th><th>关闭时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {closed.map((o) => (
                  <tr key={o.id} className="hover:bg-ink-50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-ink-900">{o.title}</div>
                      <div className="text-xs text-ink-400">{o.id}</div>
                    </td>
                    <td className="px-3 py-2.5">{o.customerName}</td>
                    <td className="px-3 py-2.5 text-right num">¥{money(o.actualAmount ?? o.amount)}</td>
                    <td className="px-3 py-2.5"><Badge tone={o.status === 'WON' ? 'success' : 'neutral'}>{o.status === 'WON' ? '赢单' : '输单'}</Badge></td>
                    <td className="px-3 py-2.5 text-xs">{o.lostReason ?? '-'}</td>
                    <td className="px-3 py-2.5 text-xs">{o.competitor ?? '-'}</td>
                    <td className="px-3 py-2.5">{o.ownerName}</td>
                    <td className="px-3 py-2.5 text-xs">{o.closedAt?.slice(0, 10) ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* 商机详情抽屉 */}
      <OpportunityDrawer
        opp={detail}
        histories={detail ? db.stageHistories.filter((h) => h.opportunityId === detail.id) : []}
        quotations={detail ? db.quotations.filter((q) => q.opportunityId === detail.id) : []}
        orders={detail ? db.orders.filter((o) => o.customerId === detail.customerId) : []}
        onClose={() => setDetail(null)}
        onMove={(to, rk) => {
          if (!detail) return;
          const r = moveStage(detail.id, to, rk || '详情面板推进');
          if (!r.ok) toast(r.message, 'error');
          else setDetail(null);
        }}
        onCloseOpp={(result) => {
          if (detail) setCloseTarget({ opp: detail, result });
        }}
      />

      <CreateOppModal
        open={createOpen}
        customers={db.customers}
        onClose={() => setCreateOpen(false)}
        onCreate={(input) => { createOpportunity(input); setCreateOpen(false); }}
        existing={openOpps}
      />

      <CloseModal
        target={closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={(payload) => {
          if (closeTarget) closeOpportunity(closeTarget.opp.id, closeTarget.result, payload);
          setCloseTarget(null); setDetail(null);
        }}
      />
    </div>
  );
}

/* ==================== 商机详情抽屉 ==================== */

function OpportunityDrawer({
  opp, histories, quotations, orders, onClose, onMove, onCloseOpp,
}: {
  opp: Opportunity | null;
  histories: import('@/types').StageHistory[];
  quotations: import('@/types').Quotation[];
  orders: import('@/types').Order[];
  onClose: () => void;
  onMove: (to: Stage, remark: string) => void;
  onCloseOpp: (result: 'WON' | 'LOST') => void;
}) {
  const [remark, setRemark] = useState('');
  if (!opp) return null;

  const idx = STAGES.findIndex((s) => s.code === opp.stage);
  const signedOrder = orders.find((o) => o.status !== 'PENDING' && o.status !== 'CANCELLED');

  return (
    <Drawer
      open={!!opp}
      width="w-[620px]"
      title={<span>{opp.title} <span className="ml-1 text-xs font-normal text-ink-400">{opp.id}</span></span>}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>关闭</Button>
          {opp.status === 'OPEN' && (
            <>
              <Button variant="danger" onClick={() => onCloseOpp('LOST')}>标记输单</Button>
              {signedOrder && <Button variant="success" onClick={() => onCloseOpp('WON')}>标记赢单</Button>}
            </>
          )}
        </>
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">商机金额</div>
          <div className="mt-1 text-lg font-semibold num">¥{money(opp.amount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">当前阶段</div>
          <div className="mt-1 text-lg font-semibold">{STAGE_MAP[opp.stage].name}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">加权预测</div>
          <div className="mt-1 text-lg font-semibold num">¥{moneyShort(opp.amount * opp.probability / 100)}</div>
        </div>
      </div>

      <div className="mb-4 space-y-1.5 text-sm">
        <div className="flex"><span className="w-20 text-ink-500">客户</span><span>{opp.customerName}</span></div>
        <div className="flex"><span className="w-20 text-ink-500">负责人</span><span>{opp.ownerName}</span></div>
        <div className="flex"><span className="w-20 text-ink-500">预计成交</span><span>{opp.expectedCloseDate}</span></div>
        <div className="flex"><span className="w-20 text-ink-500">来源</span><span>{opp.source}</span></div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-ink-800">阶段推进</div>
        <div className="mb-2 flex items-center gap-1">
          {STAGES.map((s, i) => (
            <React.Fragment key={s.code}>
              <button
                onClick={() => onMove(s.code, remark)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  i === idx ? 'text-white' : i < idx ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                }`}
                style={i === idx ? { backgroundColor: s.color } : undefined}
                title={s.requirement}
              >
                {s.code} {s.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          下一阶段「{STAGES[Math.min(idx + 1, STAGES.length - 1)].name}」前置条件：{STAGES[Math.min(idx + 1, STAGES.length - 1)].requirement}
        </div>
        <div className="mt-2">
          <Field label="推进备注">
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="记录推进依据（选填）" />
          </Field>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-ink-800">关联报价单（{quotations.length}）</div>
        {quotations.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink-300 px-3 py-4 text-center text-xs text-ink-400">
            尚未创建报价单，进入「方案报价」阶段需至少 1 张
          </div>
        ) : (
          <div className="space-y-1.5">
            {quotations.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 text-xs">
                <span className="font-medium">{q.id}</span>
                <span className="num">¥{money(q.discountAmount)}</span>
                <Badge tone={q.status === 'APPROVED' || q.status === 'CONVERTED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {q.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-ink-800">阶段变更历史（{histories.length}）</div>
        <ol className="relative ml-1 border-l border-ink-200 pl-4">
          {histories.map((h) => (
            <li key={h.id} className="relative pb-3">
              <span className="absolute -left-[22px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] text-brand-700 ring-4 ring-white">→</span>
              <div className="text-xs text-ink-400">{h.createdAt} · {h.operatorName}</div>
              <div className="text-sm text-ink-800">
                {h.fromStage ? `${STAGE_MAP[h.fromStage].name} → ${STAGE_MAP[h.toStage].name}` : `创建并进入 ${STAGE_MAP[h.toStage].name}`}
              </div>
              {h.remark && <div className="text-xs text-ink-500">{h.remark}</div>}
            </li>
          ))}
        </ol>
      </div>
    </Drawer>
  );
}

/* ==================== 新建商机 ==================== */

function CreateOppModal({
  open, customers, existing, onClose, onCreate,
}: {
  open: boolean; customers: Customer[]; existing: Opportunity[];
  onClose: () => void;
  onCreate: (input: Omit<Opportunity, 'id' | 'createdAt' | 'status' | 'stage' | 'probability' | 'ownerName' | 'customerName' | 'ownerId'>) => void;
}) {
  const [f, setF] = useState({
    customerId: customers[0]?.id ?? '', title: '', amount: '', expectedCloseDate: addDays(today(), 90), source: '官网表单', remark: '',
  });
  const [warn, setWarn] = useState('');

  const check = (cid: string) => {
    setF({ ...f, customerId: cid });
    const dup = existing.find((o) => o.customerId === cid);
    setWarn(dup ? `该客户已存在进行中的商机「${dup.title}」（${dup.id}），可能存在撞单（BR-09），请确认后再创建` : '');
  };

  return (
    <Modal
      open={open} title="新建商机" onClose={onClose} width="max-w-xl"
      footer={<><Button onClick={onClose}>取消</Button>
        <Button variant="primary" disabled={!f.title.trim() || !f.customerId} onClick={() => onCreate({
          customerId: f.customerId, title: f.title, amount: Number(f.amount) || 0,
          expectedCloseDate: f.expectedCloseDate, source: f.source, remark: f.remark,
        })}>创建</Button></>}
    >
      {warn && <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{warn}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="关联客户" required>
          <Select value={f.customerId} onChange={(e) => check(e.target.value)}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="商机标题" required>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="预估金额（元）" required>
          <Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </Field>
        <Field label="预计成交日" required>
          <Input type="date" value={f.expectedCloseDate} onChange={(e) => setF({ ...f, expectedCloseDate: e.target.value })} />
        </Field>
        <Field label="商机来源">
          <Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
            {['官网表单', '展会名录', '电话咨询', '客户转介绍', '广告投放', '老客户增购'].map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <div />
        <div className="col-span-2"><Field label="备注"><Textarea rows={2} value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></Field></div>
      </div>
    </Modal>
  );
}

/* ==================== 赢单/输单 ==================== */

function CloseModal({
  target, onClose, onConfirm,
}: {
  target: { opp: Opportunity; result: 'WON' | 'LOST' } | null;
  onClose: () => void;
  onConfirm: (p: { reason?: string; competitor?: string; actualAmount?: number }) => void;
}) {
  const [reason, setReason] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [amount, setAmount] = useState('');
  if (!target) return null;
  const isWon = target.result === 'WON';

  return (
    <Modal
      open={!!target}
      title={isWon ? `标记赢单：${target.opp.title}` : `标记输单：${target.opp.title}`}
      onClose={onClose} width="max-w-md"
      footer={<><Button onClick={onClose}>取消</Button>
        <Button variant={isWon ? 'success' : 'danger'} onClick={() => onConfirm({ reason: isWon ? undefined : reason, competitor, actualAmount: Number(amount) || 0 })}>
          确认
        </Button></>}
    >
      {isWon ? (
        <div className="space-y-3">
          <div className="rounded-md bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
            已检测到该客户存在已签约订单，满足赢单前置条件（FR-05-04）。
          </div>
          <Field label="实际成交金额（元）" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(target.opp.amount)} />
          </Field>
          <Field label="竞品（选填）"><Input value={competitor} onChange={(e) => setCompetitor(e.target.value)} /></Field>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="输单原因" required hint="依据 BR-08，输单必须填写原因">
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">请选择</option>
              {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="竞品名称（选填）"><Input value={competitor} onChange={(e) => setCompetitor(e.target.value)} /></Field>
        </div>
      )}
    </Modal>
  );
}
