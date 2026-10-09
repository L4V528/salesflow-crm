/** 基础 UI 组件库 —— 对应《UI 设计规范与组件说明》SFS-CRM-UI-01 */

import React from 'react';
import type { Tone } from '@/config/businessRules';

export function cn(...cls: (string | false | null | undefined)[]): string {
  return cls.filter(Boolean).join(' ');
}

/* ==================== 卡片 ==================== */

export function Card({
  title, extra, children, className, bodyClassName, dense,
}: {
  title?: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode;
  className?: string; bodyClassName?: string; dense?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border border-ink-200 bg-white shadow-card', className)}>
      {(title || extra) && (
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
          <div className="flex items-center gap-2">{extra}</div>
        </div>
      )}
      <div className={cn(dense ? 'p-0' : 'p-4', bodyClassName)}>{children}</div>
    </div>
  );
}

/* ==================== 按钮 ==================== */

export function Button({
  children, onClick, variant = 'default', size = 'md', disabled, type = 'button', className, title,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'default' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md'; disabled?: boolean; type?: 'button' | 'submit'; className?: string; title?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap';
  const sizes = { sm: 'h-7 px-2.5 text-xs', md: 'h-9 px-3.5 text-sm' };
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    default: 'border border-ink-300 bg-white text-ink-700 hover:bg-ink-50',
    ghost: 'text-ink-600 hover:bg-ink-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}

/* ==================== 徽标 ==================== */

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  primary: 'bg-brand-50 text-brand-700 ring-brand-200',
};

export function Badge({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONE_CLASS[tone], className)}>
      {children}
    </span>
  );
}

/* ==================== 表单控件 ==================== */

export function Field({ label, required, children, hint, error }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-600">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
}

const inputCls = 'h-9 w-full rounded-md border border-ink-300 bg-white px-3 text-sm text-ink-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, 'pr-8', props.className)} />;
}

/* ==================== 弹窗 / 抽屉 ==================== */

export function Modal({
  open, title, onClose, children, footer, width = 'max-w-2xl',
}: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-lg bg-white shadow-pop', width)}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700" aria-label="关闭">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open, title, onClose, children, footer, width = 'w-[560px]',
}: {
  open: boolean; title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/30" onClick={onClose} />
      <div className={cn('relative z-10 flex h-full flex-col bg-white shadow-pop', width)}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <div className="text-base font-semibold text-ink-900">{title}</div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700" aria-label="关闭">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ==================== 表格 ==================== */

export function Table({ head, children, className }: { head: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold text-ink-600">
            {head}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('whitespace-nowrap px-3 py-2.5 font-semibold', className)}>{children}</th>;
}

export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn('px-3 py-2.5 text-ink-700', className)}>{children}</td>;
}

export function EmptyState({ text = '暂无数据', hint }: { text?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-14 text-center">
      <div className="text-3xl text-ink-200">◻</div>
      <div className="text-sm text-ink-500">{text}</div>
      {hint && <div className="text-xs text-ink-400">{hint}</div>}
    </div>
  );
}

/* ==================== 统计卡片 ==================== */

export function StatCard({
  label, value, sub, tone = 'primary', icon, onClick,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'primary' | 'warning' | 'success' | 'danger' | 'info'; icon?: string; onClick?: () => void;
}) {
  const toneCls = {
    primary: 'bg-brand-50 text-brand-700',
    warning: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-sky-50 text-sky-700',
  }[tone];
  return (
    <div
      onClick={onClick}
      className={cn('rounded-lg border border-ink-200 bg-white p-4 shadow-card transition', onClick && 'cursor-pointer hover:border-brand-300 hover:shadow-pop')}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-ink-500">{label}</div>
        {icon && <span className={cn('flex h-7 w-7 items-center justify-center rounded-md text-sm', toneCls)}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-ink-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
    </div>
  );
}

/* ==================== 标签页 ==================== */

export function Tabs({ items, active, onChange }: { items: { key: string; label: React.ReactNode }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-ink-200">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={cn(
            '-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition',
            active === it.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ==================== 进度条 ==================== */

export function Progress({ value, tone = 'primary', showText }: { value: number; tone?: 'primary' | 'success' | 'warning' | 'danger'; showText?: boolean }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const cls = { primary: 'bg-brand-600', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500' }[tone];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div className={cn('h-full rounded-full transition-all', cls)} style={{ width: `${pct}%` }} />
      </div>
      {showText && <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-600">{pct.toFixed(0)}%</span>}
    </div>
  );
}

/* ==================== 审批流程时间线（纵向） ==================== */

export function Stepper({ steps }: { steps: { title: string; desc?: string; status: 'done' | 'current' | 'todo' | 'reject'; meta?: string }[] }) {
  return (
    <ol className="relative ml-1 border-l border-ink-200 pl-5">
      {steps.map((s, i) => (
        <li key={i} className={cn('relative pb-5', i === steps.length - 1 && 'pb-0')}>
          <span
            className={cn(
              'absolute -left-[26px] flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ring-4 ring-white',
              s.status === 'done' && 'bg-emerald-500 text-white',
              s.status === 'current' && 'bg-amber-500 text-white',
              s.status === 'reject' && 'bg-rose-500 text-white',
              s.status === 'todo' && 'bg-ink-200 text-ink-600',
            )}
          >
            {s.status === 'done' ? '✓' : s.status === 'reject' ? '✕' : i + 1}
          </span>
          <div className={cn('text-sm font-medium', s.status === 'reject' ? 'text-rose-600' : 'text-ink-800')}>{s.title}</div>
          {s.desc && <div className="mt-0.5 text-xs text-ink-500">{s.desc}</div>}
          {s.meta && <div className="mt-0.5 text-xs text-ink-400">{s.meta}</div>}
        </li>
      ))}
    </ol>
  );
}

/* ==================== Toast ==================== */

export function ToastHost({ items, onDismiss }: { items: { id: number; tone: string; message: string }[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="fixed right-5 top-5 z-[100] flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={cn(
            'cursor-pointer rounded-md border px-3.5 py-2.5 text-sm shadow-pop',
            t.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
            t.tone === 'error' && 'border-rose-200 bg-rose-50 text-rose-800',
            t.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800',
            t.tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-800',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
