import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { DEMO_ACCOUNTS } from '@/data/seed';
import { Button, Field, Input, Badge } from '@/components/ui';
import { ROLE_LABEL } from '@/config/businessRules';

export default function Login() {
  const { login, toast } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!username.trim()) { setError('请输入账号'); return; }
    if (!password) { setError('请输入密码'); return; }
    const r = login(username, password);
    if (!r.ok) { setError(r.message); return; }
    toast(r.message, 'success');
    navigate('/dashboard');
  };

  const quickLogin = (u: string) => {
    setUsername(u);
    setPassword('123456');
    const r = login(u, '123456');
    if (r.ok) {
      toast(r.message, 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 左侧品牌区 */}
      <div className="flex w-[46%] flex-col justify-between bg-ink-900 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold">S</span>
          <div>
            <div className="text-lg font-semibold">SalesFlow 智销云</div>
            <div className="text-xs text-ink-400">销售全流程管理平台</div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold leading-snug">
            从线索到回款<br />让每一笔生意有迹可循
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
            覆盖线索获取、客户建档、商机推进、报价审批、合同签署到回款确认的完整 L2C 业务闭环。
            流程在线化、审批留痕化、预测数据化。
          </p>

          <div className="mt-8 space-y-2.5">
            {[
              ['线索管理', '线索池统一分配，跟进过程全程留痕，转化率可量化'],
              ['商机看板', '五阶段状态机驱动，加权预测金额辅助目标判断'],
              ['报价审批', '折扣率自动触发审批链，二级审批规则内置'],
              ['回款管理', '分期计划自动生成，逾期实时预警'],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-3 rounded-md bg-ink-800/60 p-3">
                <span className="mt-0.5 text-brand-400">●</span>
                <div>
                  <div className="text-sm font-medium">{t}</div>
                  <div className="text-xs text-ink-400">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-ink-500">
          软件工程课程作业 · SalesFlow CRM v1.0.0 · 文档编号 SFS-CRM
        </div>
      </div>

      {/* 右侧登录区 */}
      <div className="flex flex-1 items-center justify-center bg-white p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-ink-900">账号登录</h2>
          <p className="mt-1 text-xs text-ink-500">请使用企业分配的销售平台账号登录</p>

          <div className="mt-7 space-y-4">
            <Field label="账号" required>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入账号" onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </Field>
            <Field label="密码" required error={error}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </Field>
            <Button variant="primary" className="w-full" onClick={submit}>登 录</Button>
          </div>

          <div className="mt-8 border-t border-ink-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-600">演示账号（点击一键登录）</span>
              <span className="text-xs text-ink-400">密码统一 123456</span>
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  onClick={() => quickLogin(a.username)}
                  className="flex w-full items-center gap-3 rounded-md border border-ink-200 p-2.5 text-left transition hover:border-brand-400 hover:bg-brand-50/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                    {a.name.slice(0, 1)}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
                      {a.name}
                      <Badge tone="primary">{ROLE_LABEL[a.role]}</Badge>
                    </span>
                    <span className="block text-xs text-ink-500">{a.desc}</span>
                  </span>
                  <span className="text-xs text-ink-300">登录 →</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
              不同角色可见菜单与可操作按钮不同：销售员仅见自己名下数据，销售经理可分配线索与审批报价，
              商务财务负责合同审核与回款确认，管理员维护用户与产品目录。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
