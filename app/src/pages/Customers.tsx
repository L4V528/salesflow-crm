import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import {
  Card, Table, Th, Td, Badge, Button, Input, Select, Field, Drawer, EmptyState, Tabs, Progress, Textarea,
} from '@/components/ui';
import { visibleCustomers } from '@/store/selectors';
import { INDUSTRIES, calcCustomerLevel, CUSTOMER_LEVEL_A, CUSTOMER_LEVEL_B } from '@/config/businessRules';
import { money, moneyShort, maskPhone } from '@/lib/format';
import type { Customer } from '@/types';

export default function Customers() {
  const { db, user, addContact, transferCustomer, updateCustomer } = useApp();
  const [kw, setKw] = useState('');
  const [level, setLevel] = useState('');
  const [industry, setIndustry] = useState('');
  const [detail, setDetail] = useState<Customer | null>(null);
  const [tab, setTab] = useState('base');

  const customers = useMemo(() => visibleCustomers(db, user), [db, user]);

  const filtered = useMemo(() => customers.filter((c) => {
    if (kw && !`${c.name}${c.id}${c.industry}`.includes(kw)) return false;
    if (level && c.level !== level) return false;
    if (industry && c.industry !== industry) return false;
    return true;
  }), [customers, kw, level, industry]);

  const contactsOf = (id: string) => db.contacts.filter((c) => c.customerId === id);
  const ordersOf = (id: string) => db.orders.filter((o) => o.customerId === id);
  const oppsOf = (id: string) => db.opportunities.filter((o) => o.customerId === id);
  const paymentsOf = (id: string) => {
    const orderIds = new Set(ordersOf(id).map((o) => o.id));
    return db.payments.filter((p) => orderIds.has(p.orderId));
  };

  return (
    <div>
      <PageHeader
        title="客户管理"
        desc="客户 360 视图：基础信息、联系人、商机、订单、回款记录一站式聚合"
      />

      <FilterBar>
        <Field label="关键词">
          <Input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="客户名称/编号/行业" className="w-56" />
        </Field>
        <Field label="客户等级">
          <Select value={level} onChange={(e) => setLevel(e.target.value)} className="w-28">
            <option value="">全部</option>
            <option value="A">A 级</option><option value="B">B 级</option><option value="C">C 级</option>
          </Select>
        </Field>
        <Field label="所属行业">
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-32">
            <option value="">全部</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
        </Field>
        <Button onClick={() => { setKw(''); setLevel(''); setIndustry(''); }}>重置</Button>
        <div className="ml-auto text-xs text-ink-500">
          共 {filtered.length} 家客户 · 累计成交 ¥{moneyShort(filtered.reduce((a, b) => a + b.totalAmount, 0))}
        </div>
      </FilterBar>

      <Card dense>
        {filtered.length === 0 ? (
          <EmptyState text="没有符合条件的客户" />
        ) : (
          <Table head={<>
            <Th>客户编号 / 名称</Th><Th>行业</Th><Th>等级</Th><Th>归属销售</Th>
            <Th className="text-right">累计成交</Th><Th>商机</Th><Th>订单</Th><Th>建档时间</Th><Th>操作</Th>
          </>}>
            {filtered.map((c) => {
              const o = oppsOf(c.id);
              const ord = ordersOf(c.id);
              return (
                <tr key={c.id} className="hover:bg-ink-50">
                  <Td>
                    <div className="font-medium text-ink-900">{c.name}</div>
                    <div className="text-xs text-ink-400">{c.id}</div>
                  </Td>
                  <Td>{c.industry}</Td>
                  <Td>
                    <Badge tone={c.level === 'A' ? 'danger' : c.level === 'B' ? 'warning' : 'neutral'}>
                      {c.level} 级{c.levelAuto ? '' : '（人工）'}
                    </Badge>
                  </Td>
                  <Td>{c.ownerName}</Td>
                  <Td className="text-right num">¥{money(c.totalAmount)}</Td>
                  <Td>{o.filter((x) => x.status === 'OPEN').length} 进行中 / {o.length}</Td>
                  <Td>{ord.length}</Td>
                  <Td className="text-xs">{c.createdAt.slice(0, 10)}</Td>
                  <Td><Button size="sm" variant="ghost" onClick={() => { setDetail(c); setTab('base'); }}>360 详情</Button></Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <CustomerDrawer
        customer={detail}
        tab={tab}
        onTab={setTab}
        contacts={detail ? contactsOf(detail.id) : []}
        opportunities={detail ? oppsOf(detail.id) : []}
        orders={detail ? ordersOf(detail.id) : []}
        payments={detail ? paymentsOf(detail.id) : []}
        salesUsers={db.users.filter((u) => u.role === 'SALES' || u.role === 'MANAGER')}
        onClose={() => setDetail(null)}
        onAddContact={addContact}
        onTransfer={transferCustomer}
        onUpdate={updateCustomer}
      />
    </div>
  );
}

/* ==================== 客户 360 抽屉 ==================== */

function CustomerDrawer({
  customer, tab, onTab, contacts, opportunities, orders, payments, salesUsers,
  onClose, onAddContact, onTransfer, onUpdate,
}: {
  customer: Customer | null; tab: string; onTab: (t: string) => void;
  contacts: import('@/types').Contact[];
  opportunities: import('@/types').Opportunity[];
  orders: import('@/types').Order[];
  payments: import('@/types').Payment[];
  salesUsers: import('@/types').User[];
  onClose: () => void;
  onAddContact: (c: Omit<import('@/types').Contact, 'id'>) => void;
  onTransfer: (customerId: string, toUserId: string, withOpportunities: boolean) => void;
  onUpdate: (id: string, patch: Partial<Customer>) => void;
}) {
  const [contactForm, setContactForm] = useState({ name: '', title: '', phone: '', email: '', isPrimary: false });
  const [transferTo, setTransferTo] = useState('');
  const [withOpp, setWithOpp] = useState(true);
  const [editRemark, setEditRemark] = useState('');

  if (!customer) return null;

  const autoLevel = calcCustomerLevel(customer.totalAmount);

  const tabs = [
    { key: 'base', label: '基础信息' },
    { key: 'contact', label: `联系人 (${contacts.length})` },
    { key: 'opp', label: `商机 (${opportunities.length})` },
    { key: 'order', label: `订单 (${orders.length})` },
    { key: 'pay', label: `回款 (${payments.length})` },
  ];

  return (
    <Drawer
      open={!!customer}
      width="w-[720px]"
      title={
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-sm font-semibold text-brand-700">
            {customer.name.slice(0, 2)}
          </span>
          <div>
            <div className="text-base font-semibold">{customer.name}</div>
            <div className="text-xs font-normal text-ink-400">{customer.id} · {customer.industry} · {customer.ownerName}</div>
          </div>
        </div>
      }
      onClose={onClose}
      footer={<><Button onClick={onClose}>关闭</Button></>}
    >
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">累计成交</div>
          <div className="mt-1 text-lg font-semibold num">¥{moneyShort(customer.totalAmount)}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">客户等级</div>
          <div className="mt-1 text-lg font-semibold">{customer.level} 级</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">进行中商机</div>
          <div className="mt-1 text-lg font-semibold">{opportunities.filter((o) => o.status === 'OPEN').length}</div>
        </div>
        <div className="rounded-md bg-ink-50 p-3">
          <div className="text-xs text-ink-500">历史订单</div>
          <div className="mt-1 text-lg font-semibold">{orders.length}</div>
        </div>
      </div>

      <Tabs items={tabs} active={tab} onChange={onTab} />

      <div className="mt-4">
        {tab === 'base' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="客户编号" value={customer.id} />
              <Info label="所属行业" value={customer.industry} />
              <Info label="归属销售" value={customer.ownerName} />
              <Info label="客户来源" value={customer.source} />
              <Info label="详细地址" value={customer.address || '-'} />
              <Info label="官网" value={customer.website || '-'} />
              <Info label="建档时间" value={customer.createdAt} />
              <Info label="来源线索" value={customer.leadId ?? '-'} />
            </div>

            <div className="rounded-md border border-ink-200 p-3">
              <div className="mb-2 text-xs font-medium text-ink-600">客户等级评定（FR-04-04）</div>
              <div className="mb-2 text-xs text-ink-500">
                累计成交 ≥ ¥{(CUSTOMER_LEVEL_A / 10000).toFixed(0)} 万为 A 级，≥ ¥{(CUSTOMER_LEVEL_B / 10000).toFixed(0)} 万为 B 级，其余 C 级。
                当前系统自动评定：<b>{autoLevel} 级</b>，实际生效：<b>{customer.level} 级</b>
                {!customer.levelAuto && <span className="ml-1 text-amber-600">（已被人工覆盖）</span>}
              </div>
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as const).map((l) => (
                  <Button
                    key={l}
                    size="sm"
                    variant={customer.level === l ? 'primary' : 'default'}
                    onClick={() => onUpdate(customer.id, { level: l, levelAuto: false })}
                  >
                    设为 {l} 级
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => onUpdate(customer.id, { level: autoLevel, levelAuto: true })}>恢复自动评定</Button>
              </div>
            </div>

            <div className="rounded-md border border-ink-200 p-3">
              <div className="mb-2 text-xs font-medium text-ink-600">客户转移</div>
              <div className="flex items-end gap-2">
                <Field label="新归属销售">
                  <Select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-44">
                    <option value="">请选择</option>
                    {salesUsers.filter((u) => u.id !== customer.ownerId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </Field>
                <label className="flex h-9 items-center gap-1.5 text-xs text-ink-600">
                  <input type="checkbox" checked={withOpp} onChange={(e) => setWithOpp(e.target.checked)} />
                  同步转移进行中商机
                </label>
                <Button size="sm" variant="default" disabled={!transferTo} onClick={() => { onTransfer(customer.id, transferTo, withOpp); setTransferTo(''); }}>
                  确认转移
                </Button>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="备注">
                  <Textarea rows={2} value={editRemark} onChange={(e) => setEditRemark(e.target.value)} placeholder="补充客户背景信息" />
                </Field>
              </div>
              <Button size="sm" variant="primary" onClick={() => onUpdate(customer.id, { website: customer.website })} disabled={!editRemark.trim()}>
                保存备注
              </Button>
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="space-y-4">
            <div className="rounded-md border border-ink-200 p-3">
              <div className="mb-2 text-xs font-medium text-ink-600">新增联系人</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="姓名" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                <Input placeholder="职位" value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} />
                <Input placeholder="手机号" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                <Input placeholder="邮箱" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-600">
                  <input type="checkbox" checked={contactForm.isPrimary} onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })} />
                  设为主联系人
                </label>
                <Button
                  size="sm" variant="primary"
                  disabled={!contactForm.name.trim()}
                  onClick={() => {
                    onAddContact({ customerId: customer.id, ...contactForm });
                    setContactForm({ name: '', title: '', phone: '', email: '', isPrimary: false });
                  }}
                >
                  添加
                </Button>
              </div>
            </div>

            {contacts.length === 0 ? (
              <EmptyState text="暂无联系人" />
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2.5">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
                        {c.name}
                        {c.isPrimary && <Badge tone="primary">主联系人</Badge>}
                        <span className="text-xs font-normal text-ink-500">{c.title}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-ink-500 num">{maskPhone(c.phone)} · {c.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'opp' && (
          opportunities.length === 0 ? <EmptyState text="该客户暂无商机" /> : (
            <div className="space-y-2">
              {opportunities.map((o) => (
                <div key={o.id} className="rounded-md border border-ink-200 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-900">{o.title}</span>
                    <Badge tone={o.status === 'WON' ? 'success' : o.status === 'LOST' ? 'neutral' : 'primary'}>
                      {o.status === 'WON' ? '赢单' : o.status === 'LOST' ? '输单' : `S${o.stage.slice(1)} 阶段`}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-ink-500">
                    <span>金额 ¥{money(o.amount)}</span>
                    <span>赢率 {o.probability}%</span>
                    <span>预计成交 {o.expectedCloseDate}</span>
                    <span>负责人 {o.ownerName}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'order' && (
          orders.length === 0 ? <EmptyState text="该客户暂无订单" /> : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="rounded-md border border-ink-200 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-900">{o.id} · {o.contractNo}</span>
                    <Badge tone={o.status === 'COMPLETED' ? 'success' : o.status === 'CANCELLED' ? 'neutral' : 'info'}>{o.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-ink-500">
                    <span>合同金额 ¥{money(o.amount)}</span>
                    <span>已回款 ¥{money(o.paidAmount)}</span>
                    <span>签订 {o.signDate}</span>
                  </div>
                  <div className="mt-2"><Progress value={o.amount > 0 ? o.paidAmount / o.amount : 0} showText /></div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'pay' && (
          payments.length === 0 ? <EmptyState text="该客户暂无回款记录" /> : (
            <Table head={<><Th>回款编号</Th><Th>金额</Th><Th>方式</Th><Th>日期</Th><Th>状态</Th><Th>发票</Th></>}>
              {payments.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">{p.id}</Td>
                  <Td className="num">¥{money(p.amount)}</Td>
                  <Td>{p.method}</Td>
                  <Td>{p.payDate}</Td>
                  <Td><Badge tone={p.status === 'CONFIRMED' ? 'success' : 'warning'}>{p.status === 'CONFIRMED' ? '已确认' : '待确认'}</Badge></Td>
                  <Td>{p.invoiceNo || '-'}</Td>
                </tr>
              ))}
            </Table>
          )
        )}
      </div>
    </Drawer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-20 shrink-0 text-ink-500">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  );
}
