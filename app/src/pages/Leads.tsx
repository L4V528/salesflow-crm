import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import {
  Card, Table, Th, Td, Badge, Button, Input, Select, Field, Modal, Drawer, EmptyState, Textarea,
} from '@/components/ui';
import { visibleLeads, buildSourceDistribution } from '@/store/selectors';
import { LEAD_STATUS, LEAD_SOURCES, INDUSTRIES, LEAD_LEVELS, LEAD_LOST_REASONS, FOLLOW_UP_TYPES } from '@/config/businessRules';
import { PieChart } from '@/components/charts';
import { today, addDays, maskPhone } from '@/lib/format';
import type { Lead, FollowUpType } from '@/types';

export default function Leads() {
  const { db, user, createLead, assignLeads, addFollowUp, convertLead, loseLead } = useApp();
  const navigate = useNavigate();

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [owner, setOwner] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [assignTo, setAssignTo] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Lead | null>(null);
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  const [loseTarget, setLoseTarget] = useState<Lead | null>(null);
  const [loseReason, setLoseReason] = useState('');

  const leads = useMemo(() => visibleLeads(db, user), [db, user]);
  const salesUsers = useMemo(() => db.users.filter((u) => u.role === 'SALES' || u.role === 'MANAGER'), [db.users]);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const filtered = useMemo(() => leads.filter((l) => {
    if (kw && !`${l.companyName}${l.contactName}${l.phone}${l.id}`.includes(kw)) return false;
    if (status && l.status !== status) return false;
    if (source && l.source !== source) return false;
    if (owner && l.ownerId !== owner) return false;
    return true;
  }), [leads, kw, status, source, owner]);

  const dist = useMemo(() => buildSourceDistribution(leads), [leads]);
  const conversionRate = leads.length > 0
    ? leads.filter((l) => l.status === 'CONVERTED').length / leads.length
    : 0;

  const followUpsOf = (leadId: string) => db.followUps.filter((f) => f.leadId === leadId);

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const doAssign = () => {
    if (!assignTo) return;
    assignLeads(checked, assignTo);
    setChecked([]);
    setAssignTo('');
  };

  const allChecked = filtered.length > 0 && filtered.every((l) => checked.includes(l.id));

  return (
    <div>
      <PageHeader
        title="线索管理"
        desc="线索池统一分配，跟进过程全程留痕，转化后自动建立客户档案"
        actions={
          <>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>+ 新建线索</Button>
          </>
        }
      />

      {/* 概览 */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        {(['NEW', 'FOLLOWING', 'CONVERTED', 'LOST'] as const).map((s) => (
          <Card key={s} dense>
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-xs text-ink-500">{LEAD_STATUS[s].label}</div>
                <div className="mt-1 text-2xl font-semibold num">{leads.filter((l) => l.status === s).length}</div>
              </div>
              <Badge tone={LEAD_STATUS[s].tone}>{LEAD_STATUS[s].label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3">
          <FilterBar>
            <Field label="关键词">
              <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="公司/联系人/电话/编号" className="w-52" />
            </Field>
            <Field label="状态">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
                <option value="">全部</option>
                {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
            <Field label="来源">
              <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-32">
                <option value="">全部</option>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="归属">
              <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-36">
                <option value="">全部</option>
                {salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Button onClick={() => { setKw(''); setStatus(''); setSource(''); setOwner(''); }}>重置</Button>
          </FilterBar>

          {isManager && checked.length > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
              <span className="text-sm text-brand-800">已选 {checked.length} 条线索</span>
              <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="w-40">
                <option value="">选择归属销售</option>
                {salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name}（{u.dept}）</option>)}
              </Select>
              <Button variant="primary" size="sm" onClick={doAssign}>确认分配</Button>
              <Button size="sm" variant="ghost" onClick={() => setChecked([])}>取消选择</Button>
            </div>
          )}

          <Card dense>
            {filtered.length === 0 ? (
              <EmptyState text="没有符合条件的线索" hint="调整筛选条件或新建线索" />
            ) : (
              <Table head={<>
                {isManager && <Th className="w-10"><input type="checkbox" checked={allChecked} onChange={() => setChecked(allChecked ? [] : filtered.map((l) => l.id))} /></Th>}
                <Th>线索编号 / 公司</Th><Th>联系人</Th><Th>来源</Th><Th>意向</Th><Th>状态</Th><Th>归属</Th><Th>下次跟进</Th><Th>操作</Th>
              </>}>
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-ink-50">
                    {isManager && <Td><input type="checkbox" checked={checked.includes(l.id)} onChange={() => toggle(l.id)} disabled={l.status !== 'NEW'} /></Td>}
                    <Td>
                      <div className="font-medium text-ink-900">{l.companyName}</div>
                      <div className="text-xs text-ink-400">{l.id} · {l.industry}</div>
                    </Td>
                    <Td>
                      <div>{l.contactName}</div>
                      <div className="text-xs text-ink-400 num">{maskPhone(l.phone)}</div>
                    </Td>
                    <Td>{l.source}</Td>
                    <Td><Badge tone={l.level === 'HIGH' ? 'danger' : l.level === 'MID' ? 'warning' : 'neutral'}>{l.level === 'HIGH' ? '高' : l.level === 'MID' ? '中' : '低'}</Badge></Td>
                    <Td><Badge tone={LEAD_STATUS[l.status].tone}>{LEAD_STATUS[l.status].label}</Badge></Td>
                    <Td>{l.ownerName ?? <span className="text-ink-400">未分配</span>}</Td>
                    <Td className={l.nextFollowAt && l.nextFollowAt < today() ? 'text-rose-600' : ''}>{l.nextFollowAt ?? '-'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetail(l)}>跟进</Button>
                        {l.status !== 'CONVERTED' && l.status !== 'LOST' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setConvertTarget(l)}>转化</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setLoseTarget(l); setLoseReason(''); }}>废弃</Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        {/* 右侧统计 */}
        <div className="space-y-5">
          <Card title="线索来源分布">
            <PieChart data={dist.map((d) => ({ label: d.source, value: d.count }))} />
          </Card>
          <Card title="转化概览" dense>
            <div className="space-y-2.5 p-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">线索总数</span><b className="num">{leads.length}</b></div>
              <div className="flex justify-between"><span className="text-ink-500">已转化</span><b className="num">{leads.filter((l) => l.status === 'CONVERTED').length}</b></div>
              <div className="flex justify-between"><span className="text-ink-500">跟进中</span><b className="num">{leads.filter((l) => l.status === 'FOLLOWING').length}</b></div>
              <div className="flex justify-between"><span className="text-ink-500">待分配</span><b className="num text-amber-600">{leads.filter((l) => l.status === 'NEW').length}</b></div>
              <div className="border-t border-ink-100 pt-2.5">
                <div className="mb-1 flex justify-between text-xs"><span className="text-ink-500">整体转化率</span><b className="num">{(conversionRate * 100).toFixed(1)}%</b></div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${conversionRate * 100}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 新建线索 */}
      <CreateLeadModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createLead} />

      {/* 跟进抽屉 */}
      <FollowUpDrawer
        lead={detail}
        followUps={detail ? followUpsOf(detail.id) : []}
        onClose={() => setDetail(null)}
        onAdd={(input) => {
          addFollowUp(input);
          setDetail(null);
        }}
      />

      {/* 转化弹窗 */}
      <ConvertModal
        lead={convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={(opt) => {
          if (convertTarget) convertLead(convertTarget.id, opt);
          setConvertTarget(null);
          navigate('/customers');
        }}
      />

      {/* 废弃弹窗 */}
      <Modal
        open={!!loseTarget}
        title={`废弃线索：${loseTarget?.companyName ?? ''}`}
        onClose={() => setLoseTarget(null)}
        width="max-w-md"
        footer={
          <>
            <Button onClick={() => setLoseTarget(null)}>取消</Button>
            <Button variant="danger" onClick={() => { if (loseTarget) { loseLead(loseTarget.id, loseReason); setLoseTarget(null); } }}>确认废弃</Button>
          </>
        }
      >
        <Field label="废弃原因" required hint="依据 BR-01，废弃线索必须填写原因">
          <Select value={loseReason} onChange={(e) => setLoseReason(e.target.value)}>
            <option value="">请选择</option>
            {LEAD_LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}

/* ==================== 子组件 ==================== */

type CreateLeadFn = (input: Omit<Lead, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;

function CreateLeadModal({
  open, onClose, onCreate,
}: {
  open: boolean; onClose: () => void;
  onCreate: CreateLeadFn;
}) {
  const [f, setF] = useState({
    companyName: '', contactName: '', phone: '', source: LEAD_SOURCES[0],
    industry: INDUSTRIES[0], level: 'MID' as Lead['level'], remark: '', ownerId: '', nextFollowAt: '',
  });
  const [err, setErr] = useState<string[]>([]);

  const submit = () => {
    const e: string[] = [];
    if (!f.companyName.trim()) e.push('公司名称');
    if (!f.contactName.trim()) e.push('联系人姓名');
    if (!/^\d{7,15}$/.test(f.phone.trim())) e.push('联系电话（7-15 位数字）');
    setErr(e);
    if (e.length > 0) return;
    onCreate({
      companyName: f.companyName, contactName: f.contactName, phone: f.phone, source: f.source,
      industry: f.industry, level: f.level, remark: f.remark,
      ownerId: f.ownerId || null, ownerName: '', nextFollowAt: f.nextFollowAt || undefined,
    });
    setF({ companyName: '', contactName: '', phone: '', source: LEAD_SOURCES[0], industry: INDUSTRIES[0], level: 'MID', remark: '', ownerId: '', nextFollowAt: '' });
    setErr([]);
    onClose();
  };

  return (
    <Modal
      open={open} title="新建线索" onClose={onClose} width="max-w-xl"
      footer={<><Button onClick={onClose}>取消</Button><Button variant="primary" onClick={submit}>保存</Button></>}
    >
      {err.length > 0 && (
        <div className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          请完善必填项：{err.join('、')}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="公司名称" required><Input value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} /></Field>
        <Field label="联系人姓名" required><Input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></Field>
        <Field label="联系电话" required><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="11 位手机号" /></Field>
        <Field label="来源渠道" required>
          <Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="所属行业">
          <Select value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })}>
            {INDUSTRIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="意向等级" required>
          <Select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Lead['level'] })}>
            {LEAD_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </Select>
        </Field>
        <Field label="下次跟进日期" hint="留空表示暂不提醒">
          <Input type="date" value={f.nextFollowAt} onChange={(e) => setF({ ...f, nextFollowAt: e.target.value })} min={today()} />
        </Field>
        <div />
        <div className="col-span-2">
          <Field label="备注"><Textarea rows={3} value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}

function FollowUpDrawer({
  lead, followUps, onClose, onAdd,
}: {
  lead: Lead | null; followUps: import('@/types').FollowUp[]; onClose: () => void;
  onAdd: (input: Omit<import('@/types').FollowUp, 'id' | 'createdAt' | 'createdByName' | 'createdBy'>) => void;
}) {
  const [type, setType] = useState<FollowUpType>('电话');
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [next, setNext] = useState(addDays(today(), 3));

  if (!lead) return null;

  const submit = () => {
    if (!content.trim()) return;
    onAdd({ leadId: lead.id, type, content, result, nextFollowAt: next || undefined });
    setContent(''); setResult('');
  };

  return (
    <Drawer
      open={!!lead}
      title={<span>{lead.companyName} <span className="ml-1 text-xs font-normal text-ink-400">{lead.id}</span></span>}
      onClose={onClose}
      footer={<><Button onClick={onClose}>关闭</Button><Button variant="primary" onClick={submit} disabled={!content.trim()}>保存跟进</Button></>}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 rounded-md bg-ink-50 p-3 text-xs">
        <div><span className="text-ink-500">联系人：</span>{lead.contactName}</div>
        <div><span className="text-ink-500">电话：</span>{lead.phone}</div>
        <div><span className="text-ink-500">来源：</span>{lead.source}</div>
        <div><span className="text-ink-500">行业：</span>{lead.industry}</div>
        <div><span className="text-ink-500">归属：</span>{lead.ownerName ?? '未分配'}</div>
        <div><span className="text-ink-500">状态：</span>{LEAD_STATUS[lead.status].label}</div>
        <div className="col-span-2"><span className="text-ink-500">备注：</span>{lead.remark || '-'}</div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-ink-800">添加跟进记录</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="跟进方式">
              <Select value={type} onChange={(e) => setType(e.target.value as FollowUpType)}>
                {FOLLOW_UP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="下次跟进"><Input type="date" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          </div>
          <Field label="跟进内容" required><Textarea rows={2} value={content} onChange={(e) => setContent(e.target.value)} placeholder="记录了什么？客户反馈了什么？" /></Field>
          <Field label="跟进结果"><Input value={result} onChange={(e) => setResult(e.target.value)} /></Field>
        </div>
      </div>

      <div className="mb-2 text-sm font-semibold text-ink-800">历史跟进（{followUps.length} 条）</div>
      {followUps.length === 0 ? (
        <EmptyState text="暂无跟进记录" />
      ) : (
        <ol className="relative ml-1 border-l border-ink-200 pl-4">
          {followUps.map((f) => (
            <li key={f.id} className="relative pb-4">
              <span className="absolute -left-[22px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] text-brand-700 ring-4 ring-white">
                {f.type.slice(0, 1)}
              </span>
              <div className="text-xs text-ink-400">{f.createdAt} · {f.createdByName} · {f.type}</div>
              <div className="mt-1 text-sm text-ink-800">{f.content}</div>
              {f.result && <div className="mt-1 text-xs text-ink-500">结果：{f.result}</div>}
              {f.nextFollowAt && <div className="mt-1 text-xs text-ink-400">下次跟进：{f.nextFollowAt}</div>}
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

function ConvertModal({
  lead, onClose, onConfirm,
}: {
  lead: Lead | null; onClose: () => void;
  onConfirm: (opt: { createOpportunity: boolean; opportunityTitle?: string; amount?: number }) => void;
}) {
  const [createOpp, setCreateOpp] = useState(true);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  if (!lead) return null;

  return (
    <Modal
      open={!!lead} title="线索转化为客户" onClose={onClose} width="max-w-lg"
      footer={<><Button onClick={onClose}>取消</Button><Button variant="primary" onClick={() => onConfirm({ createOpportunity: createOpp, opportunityTitle: title, amount: Number(amount) || 0 })}>确认转化</Button></>}
    >
      <div className="mb-4 rounded-md bg-brand-50 px-3 py-2.5 text-xs text-brand-800">
        转化后将创建客户档案「{lead.companyName}」并自动生成默认联系人「{lead.contactName}」，线索状态置为已转化且不可回退。
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={createOpp} onChange={(e) => setCreateOpp(e.target.checked)} />
          同时为该客户创建商机
        </label>
        {createOpp && (
          <div className="grid grid-cols-2 gap-3 rounded-md border border-ink-200 p-3">
            <Field label="商机标题"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${lead.companyName} 采购项目`} /></Field>
            <Field label="预估金额（元）"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
