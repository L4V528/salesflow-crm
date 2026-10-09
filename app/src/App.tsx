import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { Layout } from '@/components/Layout';
import { ToastHost } from '@/components/ui';
import { ROLE_MENUS } from '@/config/businessRules';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import Customers from '@/pages/Customers';
import Opportunities from '@/pages/Opportunities';
import Quotations from '@/pages/Quotations';
import Orders from '@/pages/Orders';
import Payments from '@/pages/Payments';
import Analytics from '@/pages/Analytics';
import Admin from '@/pages/Admin';

const PATH_ROLE_KEY: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/leads': 'leads',
  '/customers': 'customers',
  '/opportunities': 'opportunities',
  '/quotations': 'quotations',
  '/orders': 'orders',
  '/payments': 'payments',
  '/analytics': 'analytics',
  '/admin': 'admin',
};

export default function App() {
  const { user, toasts, dismissToast } = useApp();
  const location = useLocation();

  // 未登录一律重定向登录页（NFR-S-01）
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  // 越权访问拦截（NFR-S-02）
  if (user) {
    const key = PATH_ROLE_KEY[location.pathname];
    if (key && !ROLE_MENUS[user.role].includes(key)) {
      return (
        <Layout>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            权限不足：当前角色（{user.role}）无权访问该模块。
          </div>
        </Layout>
      );
    }
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
      <ToastHost items={toasts} onDismiss={dismissToast} />
    </>
  );
}
