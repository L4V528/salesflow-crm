/** 轻量 SVG 图表组件（零第三方依赖，对应 FR-09 数据看板需求） */

import { moneyShort } from '@/lib/format';

/* ==================== 销售漏斗 ==================== */

export function FunnelChart({ rows }: { rows: { name: string; count: number; amount: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const w = Math.max(8, (r.amount / max) * 100);
        return (
          <div key={r.name}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink-700">{r.name}</span>
              <span className="tabular-nums text-ink-500">
                {r.count} 个 · {moneyShort(r.amount)}
              </span>
            </div>
            <div className="h-8 w-full overflow-hidden rounded bg-ink-50">
              <div
                className="flex h-full items-center justify-end rounded pr-2 text-xs font-medium text-white transition-all"
                style={{ width: `${w}%`, backgroundColor: r.color, minWidth: 56 }}
                title={`第 ${i + 1} 阶段`}
              >
                {r.count > 0 ? `${r.count}` : ''}
              </div>
            </div>
          </div>
        );
      })}
      <div className="pt-1 text-xs text-ink-400">共 {rows.length} 个阶段，宽度按商机金额比例缩放</div>
    </div>
  );
}

/* ==================== 折线趋势图 ==================== */

export function LineChart({ data, height = 220 }: { data: { month: string; amount: number }[]; height?: number }) {
  const W = 640;
  const H = height;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const max = Math.max(1, ...data.map((d) => d.amount));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.amount).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${padL},${(padT + innerH).toFixed(1)} Z`;
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b62f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b62f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = (max / ticks) * i;
        return (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#eceef2" strokeWidth="1" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#8d97a8">
              {moneyShort(v)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#lineFill)" />
      <path d={line} fill="none" stroke="#2544eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.month}>
          <circle cx={x(i)} cy={y(d.amount)} r="3.5" fill="#fff" stroke="#2544eb" strokeWidth="2">
            <title>{`${d.month}：${moneyShort(d.amount)}`}</title>
          </circle>
          {i % 2 === 0 && (
            <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="10" fill="#8d97a8">
              {d.month.slice(2)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ==================== 横向条形排行 ==================== */

export function BarRanking({ rows }: { rows: { name: string; value: number; target: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.value, r.target)));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.name}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-medium text-ink-700">
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded bg-ink-100 text-[10px] text-ink-600">{i + 1}</span>
              {r.name}
            </span>
            <span className="tabular-nums text-ink-500">
              {moneyShort(r.value)} / {moneyShort(r.target)}
            </span>
          </div>
          <div className="relative h-5 w-full overflow-hidden rounded bg-ink-50">
            <div className="h-full rounded transition-all" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color }}>
              <span className="ml-2 text-[11px] font-medium text-white">
                {r.target > 0 ? `${((r.value / r.target) * 100).toFixed(0)}%` : ''}
              </span>
            </div>
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-ink-400"
              style={{ left: `${(r.target / max) * 100}%` }}
              title={`目标 ${moneyShort(r.target)}`}
            />
          </div>
        </div>
      ))}
      <div className="pt-1 text-xs text-ink-400">虚线为目标线，实线为已确认回款达成额</div>
    </div>
  );
}

/* ==================== 环形来源分布 ==================== */

const PIE_COLORS = ['#2544eb', '#0ea5e9', '#8b5cf6', '#f59e0b', '#16a34a', '#64748b', '#db2777'];

export function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  if (total === 0) return <div className="py-10 text-center text-sm text-ink-400">暂无数据</div>;
  const size = 180;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const path = data.length === 1
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    return { path, color: PIE_COLORS[i % PIE_COLORS.length], label: d.label, value: d.value, pct: frac };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} stroke="#fff" strokeWidth="1.5">
            <title>{`${a.label}：${a.value} 条（${(a.pct * 100).toFixed(1)}%）`}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={38} fill="#fff" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18" fontWeight="600" fill="#1c2027">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#8d97a8">线索总数</text>
      </svg>
      <ul className="flex-1 space-y-1.5">
        {arcs.map((a, i) => (
          <li key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-ink-700">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: a.color }} />
              {a.label}
            </span>
            <span className="tabular-nums text-ink-500">{a.value} · {(a.pct * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==================== 迷你趋势条 ==================== */

export function MiniBars({ values, color = '#3b62f6' }: { values: number[]; color?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${Math.max(6, (v / max) * 100)}%`, backgroundColor: color, opacity: 0.35 + (v / max) * 0.65 }}>
          <title>{moneyShort(v)}</title>
        </div>
      ))}
    </div>
  );
}
