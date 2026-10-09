import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { PageHeader } from '@/components/Layout';
import { Card, Table, Th, Td, Badge, Button, Input, Select, Field, Modal, Tabs } from '@/components/ui';
import { ROLE_LABEL, LEAD_SOURCES, INDUSTRIES } from '@/config/businessRules';
import { money, now } from '@/lib/format';
import type { Role, User, Product } from '@/types';

export default function Admin() {
  const { db, user, upsertUser, upsertProduct, exportData, resetDemo } = useApp();
  const [tab, setTab] = useState('user');
  const [userModal, setUserModal] = useState<User | null>(null);
  const [productModal, setProductModal] = useState<Product | null>(null);

  if (user?.role !== 'ADMIN') {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">权限不足：系统管理仅管理员可访问。</div>;
  }

  return (
    <div>
      <PageHeader
        title="系统管理"
        desc="用户与组织架构、产品目录、数据字典与数据维护"
        actions={
          <>
            <Button onClick={exportData}>导出数据 JSON</Button>
            <Button variant="danger" onClick={() => { if (window.confirm('确认重置为演示数据？当前所有修改将丢失。')) resetDemo(); }}>重置演示数据</Button>
          </>
        }
      />

      <Tabs
        items={[
          { key: 'user', label: `用户管理 (${db.users.length})` },
          { key: 'product', label: `产品目录 (${db.products.length})` },
          { key: 'dict', label: '数据字典' },
          { key: 'data', label: '数据概览' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-5">
        {tab === 'user' && (
          <Card
            dense
            title="用户列表"
            extra={<Button size="sm" variant="primary" onClick={() => setUserModal(blankUser())}>+ 新增用户</Button>}
            bodyClassName="pt-0"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-ink-500">共 {db.users.length} 个账号</span>
            </div>
            <Table head={<><Th>姓名 / 账号</Th><Th>角色</Th><Th>岗位</Th><Th>部门</Th><Th>手机号</Th><Th>状态</Th><Th>操作</Th></>}>
              {db.users.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50">
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">{u.avatar}</span>
                      <div>
                        <div className="font-medium text-ink-900">{u.name}</div>
                        <div className="text-xs text-ink-400">{u.username} · {u.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge tone="primary">{ROLE_LABEL[u.role]}</Badge></Td>
                  <Td>{u.title}</Td>
                  <Td>{u.dept}</Td>
                  <Td className="num">{u.phone}</Td>
                  <Td><Badge tone={u.status === 'ACTIVE' ? 'success' : 'neutral'}>{u.status === 'ACTIVE' ? '启用' : '停用'}</Badge></Td>
                  <Td><Button size="sm" variant="ghost" onClick={() => setUserModal(u)}>编辑</Button></Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {tab === 'product' && (
          <Card
            dense
            title="产品目录"
            extra={<Button size="sm" variant="primary" onClick={() => setProductModal(blankProduct())}>+ 新增产品</Button>}
            bodyClassName="pt-0"
          >
            <div className="px-4 py-3 text-xs text-ink-500">报价单引用产品时会保存价格快照，此处调价不影响历史报价单</div>
            <Table head={<><Th>产品编号</Th><Th>产品名称</Th><Th>规格型号</Th><Th>分类</Th><Th className="text-right">标准单价</Th><Th>单位</Th><Th>状态</Th><Th>操作</Th></>}>
              {db.products.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50">
                  <Td className="font-medium">{p.id}</Td>
                  <Td>{p.name}</Td>
                  <Td className="text-xs">{p.spec}</Td>
                  <Td>{p.category}</Td>
                  <Td className="text-right num">¥{money(p.price)}</Td>
                  <Td>{p.unit}</Td>
                  <Td><Badge tone={p.status === 'ON_SALE' ? 'success' : 'neutral'}>{p.status === 'ON_SALE' ? '在售' : '已下架'}</Badge></Td>
                  <Td><Button size="sm" variant="ghost" onClick={() => setProductModal(p)}>编辑</Button></Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        {tab === 'dict' && (
          <div className="grid grid-cols-2 gap-5">
            <Card title="线索来源字典">
              <div className="flex flex-wrap gap-2">
                {LEAD_SOURCES.map((s) => <Badge key={s} tone="info">{s}</Badge>)}
              </div>
            </Card>
            <Card title="行业字典">
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((s) => <Badge key={s} tone="info">{s}</Badge>)}
              </div>
            </Card>
            <Card title="商机阶段与赢率">
              <Table head={<><Th>阶段</Th><Th>名称</Th><Th className="text-right">赢率</Th><Th>前置条件</Th></>}>
                {[
                  { code: 'S1', name: '初步接洽', p: 10, req: '无特殊要求' },
                  { code: 'S2', name: '需求确认', p: 30, req: '完成需求调研并记录' },
                  { code: 'S3', name: '方案报价', p: 60, req: '至少 1 张报价单' },
                  { code: 'S4', name: '商务谈判', p: 80, req: '存在审批通过的报价单' },
                  { code: 'S5', name: '赢单', p: 100, req: '存在已签约订单' },
                ].map((s) => (
                  <tr key={s.code}>
                    <Td className="font-medium">{s.code}</Td>
                    <Td>{s.name}</Td>
                    <Td className="text-right num">{s.p}%</Td>
                    <Td className="text-xs">{s.req}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
            <Card title="回款计划模板">
              <Table head={<><Th>付款方式</Th><Th>分期比例</Th><Th>计划日期偏移</Th></>}>
                {[
                  { name: '全额预付', ratios: '100%', offsets: '签订日 +7 天' },
                  { name: '三三四', ratios: '30% / 30% / 40%', offsets: '+7 / +30 / +90 天' },
                  { name: '验收后付', ratios: '50% / 50%', offsets: '+7 天 / 交付日 +15 天' },
                ].map((t) => (
                  <tr key={t.name}>
                    <Td className="font-medium">{t.name}</Td>
                    <Td>{t.ratios}</Td>
                    <Td className="text-xs">{t.offsets}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
          </div>
        )}

        {tab === 'data' && (
          <div className="grid grid-cols-3 gap-5">
            <Card title="数据规模统计">
              <Table head={<><Th>实体</Th><Th className="text-right">记录数</Th></>}>
                {[
                  ['用户', db.users.length], ['线索', db.leads.length], ['跟进记录', db.followUps.length],
                  ['客户', db.customers.length], ['联系人', db.contacts.length], ['商机', db.opportunities.length],
                  ['阶段历史', db.stageHistories.length], ['产品', db.products.length], ['报价单', db.quotations.length],
                  ['报价明细', db.quotationItems.length], ['审批记录', db.approvalRecords.length], ['订单', db.orders.length],
                  ['回款计划', db.paymentPlans.length], ['回款记录', db.payments.length], ['销售目标', db.targets.length],
                  ['操作日志', db.activityLogs.length],
                ].map(([k, v]) => (
                  <tr key={String(k)}>
                    <Td>{k}</Td>
                    <Td className="text-right num">{v}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
            <Card title="状态分布">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">待分配线索</span><b className="num">{db.leads.filter((l) => l.status === 'NEW').length}</b></div>
                <div className="flex justify-between"><span className="text-ink-500">审批中报价</span><b className="num">{db.quotations.filter((q) => q.status === 'APPROVING').length}</b></div>
                <div className="flex justify-between"><span className="text-ink-500">待签约订单</span><b className="num">{db.orders.filter((o) => o.status === 'PENDING').length}</b></div>
                <div className="flex justify-between"><span className="text-ink-500">逾期回款期次</span><b className="num text-rose-600">{db.paymentPlans.filter((p) => p.status === 'OVERDUE').length}</b></div>
                <div className="flex justify-between"><span className="text-ink-500">待确认回款</span><b className="num text-amber-600">{db.payments.filter((p) => p.status === 'REGISTERED').length}</b></div>
              </div>
            </Card>
            <Card title="存储信息">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">数据版本</span><b className="num">v{db.version}</b></div>
                <div className="flex justify-between"><span className="text-ink-500">存储方式</span><b>LocalStorage</b></div>
                <div className="flex justify-between"><span className="text-ink-500">存储键</span><b className="text-xs">salesflow:db</b></div>
              </div>
              <div className="mt-4 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-500">
                数据持久化于浏览器本地，导出 JSON 可用于备份或迁移。
              </div>
            </Card>
          </div>
        )}
      </div>

      <UserModal
        u={userModal}
        onClose={() => setUserModal(null)}
        onSave={(u) => { upsertUser(u); setUserModal(null); }}
      />
      <ProductModal
        p={productModal}
        onClose={() => setProductModal(null)}
        onSave={(p) => { upsertProduct(p); setProductModal(null); }}
      />
    </div>
  );
}

function blankUser(): User {
  return {
    id: `U${String(Date.now()).slice(-6)}`, username: '', password: '123456', name: '',
    role: 'SALES', title: '销售专员', dept: '华东销售一部', phone: '',
    avatar: '', status: 'ACTIVE', createdAt: now(),
  };
}

function blankProduct(): Product {
  return { id: `P${String(Date.now()).slice(-4)}`, name: '', spec: '', unit: '套', price: 0, category: '软件许可', status: 'ON_SALE' };
}

function UserModal({ u, onClose, onSave }: { u: User | null; onClose: () => void; onSave: (u: User) => void }) {
  const [f, setF] = useState<User | null>(u);
  if (!f) return null;
  const isNew = !u?.username;

  return (
    <Modal
      open={!!u} title={isNew ? '新增用户' : `编辑用户：${u?.name}`} onClose={onClose} width="max-w-xl"
      footer={<><Button onClick={onClose}>取消</Button>
        <Button variant="primary" disabled={!f.name.trim() || !f.username.trim()} onClick={() => onSave({ ...f, avatar: f.name.slice(0, 1) })}>保存</Button></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="姓名" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="登录账号" required><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} disabled={!isNew} /></Field>
        <Field label="登录密码" required><Input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Field label="角色" required>
          <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </Field>
        <Field label="岗位职称"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="所属部门"><Input value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })} /></Field>
        <Field label="手机号"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="账号状态">
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as User['status'] })}>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function ProductModal({ p, onClose, onSave }: { p: Product | null; onClose: () => void; onSave: (p: Product) => void }) {
  const [f, setF] = useState<Product | null>(p);
  if (!f) return null;

  return (
    <Modal
      open={!!p} title={p?.name ? `编辑产品：${p.name}` : '新增产品'} onClose={onClose} width="max-w-xl"
      footer={<><Button onClick={onClose}>取消</Button>
        <Button variant="primary" disabled={!f.name.trim()} onClick={() => onSave(f)}>保存</Button></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="产品编号" required><Input value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} disabled={!!p?.name} /></Field>
        <Field label="产品名称" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="规格型号"><Input value={f.spec} onChange={(e) => setF({ ...f, spec: e.target.value })} /></Field>
        <Field label="分类"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
        <Field label="标准单价（元）" required><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} /></Field>
        <Field label="单位"><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></Field>
        <Field label="上架状态">
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Product['status'] })}>
            <option value="ON_SALE">在售</option>
            <option value="OFF_SALE">已下架</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
