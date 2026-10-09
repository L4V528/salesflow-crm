/** 通用格式化与计算工具 */

/** 金额格式化：分避免浮点误差 → 元展示 */
export function yuan(v: number): number {
  return Math.round(v * 100) / 100;
}

/** 千分位格式化，保留 2 位 */
export function money(v: number): string {
  const n = Number.isFinite(v) ? v : 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 金额简写：≥1万显示 万，≥1亿显示 亿 */
export function moneyShort(v: number): string {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(2)} 亿`;
  if (Math.abs(v) >= 10_000) return `${(v / 10_000).toFixed(1)} 万`;
  return money(v);
}

export function percent(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function now(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86_400_000);
}

export function monthOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function last12Months(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const p = (n: number) => String(n).padStart(2, '0');
    out.push(`${t.getFullYear()}-${p(t.getMonth() + 1)}`);
  }
  return out;
}

/** 手机号脱敏 138****8888 */
export function maskPhone(p: string): string {
  if (!p || p.length < 7) return p || '-';
  return `${p.slice(0, 3)}****${p.slice(-4)}`;
}

export function sum(list: number[]): number {
  return yuan(list.reduce((a, b) => a + b, 0));
}
