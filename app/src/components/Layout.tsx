import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { ROLE_LABEL, ROLE_MENUS } from '@/config/businessRules';
import { Badge, Button, cn } from '@/components/ui';
import { pendingMyApproval } from '@/store/selectors';

interface MenuItem { key: string; label: string; icon: string; path: string }

const MENUS: MenuItem[] = [
  { key: 'dashboard', label: '工作台', icon: '▣', path: '/dashboard' },
  { key: 'leads', label: '线索管理', icon: '◉', path: '/leads' },
  { key: 'customers', label: '客户管理', icon: '▤', path: '/customers' },
  { key: 'opportunities', label: '商机看板', icon: '◆', path: '/opportunities' },
  { key: 'quotations', label: '报价与审批', icon: '▦', path: '/quotations' },
  { key: 'orders', label: '合同订单', icon: '▩', path: '/orders' },
  { key: 'payments', label: '回款管理', icon: '◈', path: '/payments' },
  { key: 'analytics', label: '数据看板', icon: '◐', path: '/analytics' },
  { key: 'admin', label: '系统管理', icon: '⚙', path: '/admin' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, db } = useApp();
  const navigate = useNavigate();
  const approvalCount = pendingMyApproval(db, user).length;

  if (!user) return <>{children}</>;

  const allowed = ROLE_MENUS[user.role];
  const menus = MENUS.filter((m) => allowed.includes(m.key));

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* 侧边导航 */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col bg-ink-900 text-ink-100">
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">S</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">SalesFlow</div>
            <div className="text-[11px] text-ink-400">智销云 CRM</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {menus.map((m) => (
            <NavLink
              key={m.key}
              to={m.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition',
                  isActive ? 'bg-brand-600 text-white' : 'text-ink-200 hover:bg-ink-800 hover:text-white',
                )
              }
            >
              <span className="w-4 text-center text-xs opacity-80">{m.icon}</span>
              <span className="flex-1">{m.label}</span>
              {m.key === 'quotations' && approvalCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {approvalCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-700 px-4 py-3">
          <div className="text-[11px] text-ink-400">当前版本 v1.0.0</div>
          <div className="mt-0.5 text-[11px] text-ink-500">SFS-CRM · 课程演示版</div>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="ml-56 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200 bg-white px-6">
          <div className="text-sm text-ink-500">
            销售全流程管理平台 <span className="text-ink-300">/</span> <span className="font-medium text-ink-800">L2C 业务闭环</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="primary">{ROLE_LABEL[user.role]}</Badge>
            <span className="text-sm text-ink-600">{user.name} · {user.dept}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {user.avatar}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              退出
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/** 页面标题栏 */
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
        {desc && <p className="mt-0.5 text-xs text-ink-500">{desc}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

/** 筛选栏容器 */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-ink-200 bg-white p-3">
      {children}
    </div>
  );
}
