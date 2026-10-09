import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { PageHeader } from '@/components/Layout';
import { Card, StatCard, Table, Th, Td, Badge, EmptyState, Button, Progress } from '@/components/ui';
import { FunnelChart } from '@/components/charts';
import {
  dashboardStats, visibleLeads, visibleOpportunities, visiblePlans, pendingMyApproval, buildFunnel,
} from '@/store/selectors';
import { STAGES, QUOTATION_STATUS } from '@/config/businessRules';
import { money, moneyShort, today } from '@/lib/format';

export default function Dashboard() {
  const { db, user } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => dashboardStats(db, user), [db, user]);
  const leads = useMemo(() => visibleLeads(db, user), [db, user]);
  const opps = useMemo(() => visibleOpportunities(db, user), [db, user]);
  const plans = useMemo(() => visiblePlans(db, user), [db, user]);
  const myApprovals = useMemo(() => pendingMyApproval(db, user), [db, user]);
  const funnel = useMemo(() => buildFunnel(opps.filter((o) => o.status === 'OPEN'), STAGES), [opps]);

  const todayStr = today();
  const todayFollow = leads.filter((l) => l.nextFollowAt && l.nextFollowAt <= todayStr && l.status === 'FOLLOWING');
  const isFinance = user?.role === 'FINANCE';

  return (
    <div>
      <PageHeader
        title={`你好，${user?.name}`}
        desc={`今天是 ${todayStr} · ${user?.title} · ${user?.dept}`}
        actions={
          <Button onClick={() => navigate('/opportunities')}>查看商机看板</Button>
        }
      />

      {/* 统计卡片 */}
      <div className="mb-5 grid grid-cols-4 gap-4">
        {!isFinance && (
          <StatCard
            label="待跟进线索"
            value={stats.todoLeads}
            sub={`线索池共 ${leads.filter((l) => l.status === 'NEW').length} 条待分配`}
            tone="warning"
            icon="◉"
            onClick={() => navigate('/leads')}
          />
        )}
        {!isFinance && (
          <StatCard
            label="进行中商机"
            value={stats.openOpportunities}
            sub={`加权预测 ${moneyShort(funnel.reduce((a, b) => a + b.weighted, 0))}`}
            tone="primary"
            icon="◆"
            onClick={() => navigate('/opportunities')}
          />
        )}
        <StatCard
          label="待我审批"
          value={myApprovals.length}
          sub={myApprovals.length > 0 ? `最早来自 ${myApprovals[0]?.customerName}` : '暂无待办'}
          tone={myApprovals.length > 0 ? 'danger' : 'info'}
          icon="▦"
          onClick={() => navigate('/quotations')}
        />
        <StatCard
          label="本月待回款"
          value={`¥${moneyShort(stats.planAmountThisMonth)}`}
          sub={stats.overdueCount > 0 ? `其中逾期 ${stats.overdueCount} 期` : '无逾期'}
          tone={stats.overdueCount > 0 ? 'danger' : 'success'}
          icon="◈"
          onClick={() => navigate('/payments')}
        />
      </div>

      {stats.overdueCount > 0 && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <span className="text-sm text-rose-800">
            逾期预警：有 <b>{stats.overdueCount}</b> 个回款期次已逾期，涉及金额 ¥{money(stats.overdueAmount)}
          </span>
          <Button size="sm" variant="danger" onClick={() => navigate('/payments')}>立即处理</Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* 今日待跟进 */}
        <div className="col-span-2 space-y-5">
          <Card title="今日待跟进" extra={<Button size="sm" variant="ghost" onClick={() => navigate('/leads')}>全部线索</Button>}>
            {todayFollow.length === 0 ? (
              <EmptyState text="今日没有待跟进的线索" hint="可在线索管理中为线索设置下次跟进时间" />
            ) : (
              <Table head={<><Th>线索</Th><Th>联系人</Th><Th>意向</Th><Th>计划跟进日</Th><Th>归属</Th><Th>操作</Th></>}>
                {todayFollow.slice(0, 8).map((l) => (
                  <tr key={l.id} className="hover:bg-ink-50">
                    <Td>
                      <div className="font-medium text-ink-900">{l.companyName}</div>
                      <div className="text-xs text-ink-400">{l.id} · {l.source}</div>
                    </Td>
                    <Td>{l.contactName}</Td>
                    <Td><Badge tone={l.level === 'HIGH' ? 'danger' : l.level === 'MID' ? 'warning' : 'neutral'}>{l.level === 'HIGH' ? '高' : l.level === 'MID' ? '中' : '低'}</Badge></Td>
                    <Td className={l.nextFollowAt && l.nextFollowAt < todayStr ? 'text-rose-600' : ''}>{l.nextFollowAt ?? '-'}</Td>
                    <Td>{l.ownerName ?? '-'}</Td>
                    <Td><Button size="sm" variant="ghost" onClick={() => navigate('/leads')}>跟进</Button></Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          {/* 待我审批 */}
          <Card title="待我审批的报价单" extra={<Button size="sm" variant="ghost" onClick={() => navigate('/quotations')}>审批中心</Button>}>
            {myApprovals.length === 0 ? (
              <EmptyState text="没有待您审批的报价单" />
            ) : (
              <Table head={<><Th>报价单号</Th><Th>客户</Th><Th>商机</Th><Th className="text-right">折后金额</Th><Th>折扣率</Th><Th>状态</Th><Th>操作</Th></>}>
                {myApprovals.map((q) => (
                  <tr key={q.id} className="hover:bg-ink-50">
                    <Td className="font-medium">{q.id}</Td>
                    <Td>{q.customerName}</Td>
                    <Td className="max-w-[180px] truncate">{q.opportunityTitle}</Td>
                    <Td className="text-right num">¥{money(q.discountAmount)}</Td>
                    <Td><Badge tone={q.discountRate >= 0.3 ? 'danger' : 'warning'}>{(q.discountRate * 100).toFixed(1)}%</Badge></Td>
                    <Td><Badge tone={QUOTATION_STATUS[q.status].tone}>{QUOTATION_STATUS[q.status].label}</Badge></Td>
                    <Td><Button size="sm" variant="primary" onClick={() => navigate('/quotations')}>去审批</Button></Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        {/* 右侧栏 */}
        <div className="space-y-5">
          <Card title="我的商机漏斗" dense>
            <div className="p-4">
              <FunnelChart rows={funnel.map((f) => ({ name: f.name, count: f.count, amount: f.amount, color: f.color }))} />
              <div className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-500">
                加权预测金额：<b className="text-ink-800">¥{moneyShort(funnel.reduce((a, b) => a + b.weighted, 0))}</b>
              </div>
            </div>
          </Card>

          <Card title="回款进度概览" dense>
            <div className="space-y-3 p-4">
              {plans.filter((p) => p.status !== 'PAID').slice(0, 5).map((p) => (
                <div key={p.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-700">{p.customerName} · 第 {p.period} 期</span>
                    <span className="num text-ink-500">{moneyShort(p.paidAmount)} / {moneyShort(p.planAmount)}</span>
                  </div>
                  <Progress value={p.planAmount > 0 ? p.paidAmount / p.planAmount : 0} tone={p.status === 'OVERDUE' ? 'danger' : 'primary'} />
                  <div className="mt-1 text-[11px] text-ink-400">计划日期 {p.planDate}</div>
                </div>
              ))}
              {plans.filter((p) => p.status !== 'PAID').length === 0 && <EmptyState text="全部回款已完成" />}
            </div>
          </Card>
        </div>
      </div>

      {/* 最近动态 */}
      <Card className="mt-5" title="最近动态">
        <div className="space-y-2.5">
          {db.activityLogs.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] text-brand-700">{a.actorName.slice(0, 1)}</span>
              <span className="text-ink-800">{a.actorName}</span>
              <span className="text-ink-500">{a.action}</span>
              <span className="flex-1 truncate text-ink-700">{a.target}</span>
              <span className="text-xs text-ink-400">{a.at}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
