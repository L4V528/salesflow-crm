import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { PageHeader, FilterBar } from '@/components/Layout';
import { Card, Field, Select, EmptyState, Badge, Table, Th, Td } from '@/components/ui';
import { FunnelChart, LineChart, BarRanking, PieChart } from '@/components/charts';
import {
  visibleOpportunities, visibleLeads, buildFunnel, buildRanking, buildMonthlyPayments, buildSourceDistribution,
} from '@/store/selectors';
import { STAGES } from '@/config/businessRules';
import { money, moneyShort, percent, last12Months, today } from '@/lib/format';

export default function Analytics() {
  const { db, user } = useApp();
  const [range, setRange] = useState('all');
  const [dept, setDept] = useState('');

  const opps = useMemo(() => visibleOpportunities(db, user), [db, user]);
  const leads = useMemo(() => visibleLeads(db, user), [db, user]);

  const rangedOpps = useMemo(() => {
    if (range === 'quarter') {
      const q = Math.floor(new Date(today()).getMonth() / 3);
      const y = new Date(today()).getFullYear();
      return opps.filter((o) => {
        const d = new Date(o.expectedCloseDate);
        return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q;
      });
    }
    if (range === 'year') {
      const y = new Date(today()).getFullYear();
      return opps.filter((o) => new Date(o.expectedCloseDate).getFullYear() === y);
    }
    return opps;
  }, [opps, range]);

  const filteredOpps = useMemo(() => {
    if (!dept) return rangedOpps;
    const ids = new Set(db.users.filter((u) => u.dept === dept).map((u) => u.id));
    return rangedOpps.filter((o) => ids.has(o.ownerId));
  }, [rangedOpps, dept, db.users]);

  const funnel = useMemo(() => buildFunnel(filteredOpps.filter((o) => o.status === 'OPEN'), STAGES), [filteredOpps]);
  const ranking = useMemo(() => buildRanking(db), [db]);
  const monthly = useMemo(() => buildMonthlyPayments(db, last12Months()), [db]);
  const sourceDist = useMemo(() => buildSourceDistribution(leads), [leads]);

  const won = filteredOpps.filter((o) => o.status === 'WON');
  const lost = filteredOpps.filter((o) => o.status === 'LOST');
  const winRate = won.length + lost.length > 0 ? won.length / (won.length + lost.length) : 0;
  const totalWeighted = funnel.reduce((a, b) => a + b.weighted, 0);
  const totalAmount = funnel.reduce((a, b) => a + b.amount, 0);
  const avgDeal = won.length > 0 ? won.reduce((a, b) => a + (b.actualAmount ?? b.amount), 0) / won.length : 0;

  return (
    <div>
      <PageHeader
        title="数据看板"
        desc="销售漏斗、业绩达成、回款趋势与线索来源分析，支持按时间范围与部门筛选"
      />

      <FilterBar>
        <Field label="时间范围">
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-32">
            <option value="all">全部</option>
            <option value="year">本年度</option>
            <option value="quarter">本季度</option>
          </Select>
        </Field>
        <Field label="部门">
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-40">
            <option value="">全部部门</option>
            {[...new Set(db.users.map((u) => u.dept))].map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <div className="ml-auto flex items-center gap-4 text-xs text-ink-500">
          <span>统计商机 {filteredOpps.length} 个</span>
          <span>口径：仅含已确认回款</span>
        </div>
      </FilterBar>

      {/* 关键指标 */}
      <div className="mb-4 grid grid-cols-5 gap-4">
        <Kpi label="商机总金额" value={`¥${moneyShort(totalAmount)}`} sub={`${filteredOpps.filter((o) => o.status === 'OPEN').length} 个进行中`} />
        <Kpi label="加权预测金额" value={`¥${moneyShort(totalWeighted)}`} sub="金额 × 阶段赢率" />
        <Kpi label="赢单率" value={percent(winRate, 1)} sub={`赢单 ${won.length} / 输单 ${lost.length}`} />
        <Kpi label="平均客单价" value={`¥${moneyShort(avgDeal)}`} sub="按实际成交金额计算" />
        <Kpi label="线索转化率" value={percent(leads.length > 0 ? leads.filter((l) => l.status === 'CONVERTED').length / leads.length : 0, 1)} sub={`线索总数 ${leads.length}`} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* 漏斗 */}
        <Card title="销售漏斗（按阶段）">
          <FunnelChart rows={funnel.map((f) => ({ name: f.name, count: f.count, amount: f.amount, color: f.color }))} />
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium text-ink-600">阶段转化率</div>
            <div className="space-y-1.5">
              {funnel.slice(1).map((f) => (
                <div key={f.stage} className="flex items-center justify-between text-xs">
                  <span className="text-ink-600">{funnel[funnel.indexOf(f) - 1]?.name} → {f.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="num text-ink-500">{f.conversionFromPrev !== null ? percent(f.conversionFromPrev, 1) : '-'}</span>
                    <Badge tone={f.conversionFromPrev === null ? 'neutral' : f.conversionFromPrev >= 0.6 ? 'success' : f.conversionFromPrev >= 0.3 ? 'warning' : 'danger'}>
                      {f.conversionFromPrev === null ? '无数据' : f.conversionFromPrev >= 0.6 ? '良好' : f.conversionFromPrev >= 0.3 ? '一般' : '偏低'}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 业绩排行 */}
        <Card title="销售业绩排行（2026-Q4）">
          {ranking.length === 0 ? (
            <EmptyState text="暂无目标数据" />
          ) : (
            <BarRanking
              rows={ranking.map((r, i) => ({
                name: r.userName, value: r.achieved, target: r.target,
                color: ['#2544eb', '#0ea5e9', '#8b5cf6', '#f59e0b'][i % 4],
              }))}
            />
          )}
        </Card>

        {/* 回款趋势 */}
        <Card title="近 12 个月回款趋势">
          <LineChart data={monthly} />
        </Card>

        {/* 线索来源 */}
        <Card title="线索来源分布与转化">
          <PieChart data={sourceDist.map((d) => ({ label: d.source, value: d.count }))} />
          <div className="mt-4">
            <Table head={<><Th>来源渠道</Th><Th className="text-right">线索数</Th><Th className="text-right">已转化</Th><Th className="text-right">转化率</Th></>}>
              {sourceDist.map((d) => (
                <tr key={d.source}>
                  <Td>{d.source}</Td>
                  <Td className="text-right num">{d.count}</Td>
                  <Td className="text-right num">{d.converted}</Td>
                  <Td className="text-right num">{d.count > 0 ? percent(d.converted / d.count, 1) : '-'}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      </div>

      {/* 赢单/输单明细 */}
      <Card className="mt-5" title="商机结果分析">
        {won.length + lost.length === 0 ? (
          <EmptyState text="暂无已关闭商机" />
        ) : (
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="mb-2 text-sm font-medium text-emerald-700">赢单（{won.length}）</div>
              <Table head={<><Th>商机</Th><Th>客户</Th><Th className="text-right">成交金额</Th></>}>
                {won.map((o) => (
                  <tr key={o.id}>
                    <Td>{o.title}</Td>
                    <Td>{o.customerName}</Td>
                    <Td className="text-right num">¥{money(o.actualAmount ?? o.amount)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-ink-700">输单（{lost.length}）</div>
              <Table head={<><Th>商机</Th><Th>客户</Th><Th>原因</Th><Th>竞品</Th></>}>
                {lost.map((o) => (
                  <tr key={o.id}>
                    <Td>{o.title}</Td>
                    <Td>{o.customerName}</Td>
                    <Td>{o.lostReason ?? '-'}</Td>
                    <Td>{o.competitor ?? '-'}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card dense>
      <div className="p-4">
        <div className="text-xs text-ink-500">{label}</div>
        <div className="mt-1.5 text-2xl font-semibold num text-ink-900">{value}</div>
        {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
      </div>
    </Card>
  );
}
