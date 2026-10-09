/** 业务编号生成器：{前缀}{年份}{4位序号} */

const counters = new Map<string, number>();

export function resetCounters(): void {
  counters.clear();
}

/** 依据已有数据初始化计数器，避免重置后编号冲突 */
export function primeCounter(prefix: string, existingIds: string[]): void {
  const year = new Date().getFullYear();
  const full = `${prefix}${year}`;
  let max = 0;
  for (const id of existingIds) {
    if (id.startsWith(full)) {
      const n = Number(id.slice(full.length));
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  counters.set(prefix, max);
}

export function nextId(prefix: string): string {
  const year = new Date().getFullYear();
  const n = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, n);
  return `${prefix}${year}${String(n).padStart(4, '0')}`;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
