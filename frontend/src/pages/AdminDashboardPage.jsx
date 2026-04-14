import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  BrainCircuit, 
  AlertTriangle, 
  LineChart, 
  FileText,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Flag,
  Activity
} from 'lucide-react';
import { useStore } from '../store';
import FraudBadge from '../components/FraudBadge';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
];

// Mock Data
const MOCK_USERS = [
  { id: 'USR-001234', username: 'johndoe89', status: 'VERIFIED', lastActivity: '2 mins ago', risk: 15 },
  { id: 'USR-001235', username: 'alice_smith', status: 'PENDING', lastActivity: '1 hour ago', risk: 45 },
  { id: 'USR-001236', username: 'mike.w', status: 'VERIFIED', lastActivity: '5 hours ago', risk: 5 },
  { id: 'USR-001237', username: 'suspicious_99', status: 'FLAGGED', lastActivity: '1 day ago', risk: 85 },
];

const MOCK_VERIFICATIONS = [
  { id: 'VER-9921', user: 'johndoe89', matchScore: 98.5, status: 'APPROVED', time: '10:45 AM' },
  { id: 'VER-9922', user: 'alice_smith', matchScore: 65.2, status: 'PENDING', time: '11:20 AM' },
  { id: 'VER-9923', user: 'suspicious_99', matchScore: 23.1, status: 'REJECTED', time: 'Yesterday' },
];

export default function AdminDashboardPage() {
  const { setCurrentStep } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState(null);

  const [dashboardData, setDashboardData] = useState({ total_users: 0, total_verifications: 0, success_rate: 0, active_alerts: 0 });
  const [users, setUsers] = useState(MOCK_USERS);
  const [verifications, setVerifications] = useState(MOCK_VERIFICATIONS);

  useEffect(() => {
    const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
    const fetchData = async () => {
      try {
        const dRes = await fetch(`${BASE}/admin/dashboard`);
        if (dRes.ok) setDashboardData(await dRes.json());
        
        const uRes = await fetch(`${BASE}/admin/users`);
        if (uRes.ok) setUsers(await uRes.json());
        
        const vRes = await fetch(`${BASE}/admin/verifications`);
        if (vRes.ok) setVerifications(await vRes.json());
      } catch (e) {
        console.error("Failed to fetch admin data", e);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    setCurrentStep(1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in z-10 relative">
            <h2 className="font-serif text-[24px] font-medium text-[#E6EAF2]">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={dashboardData.total_users.toLocaleString()} change="+12%" />
              <StatCard title="Verifications" value={dashboardData.total_verifications.toLocaleString()} change="+5%" />
              <StatCard title="Success Rate" value={`${dashboardData.success_rate}%`} change="+1.2%" />
              <StatCard title="Active Alerts" value={dashboardData.active_alerts} change="-4" accent="rose" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="glass-card p-6">
                 <h3 className="font-sans text-[11px] font-bold tracking-[1.5px] uppercase text-white/50 mb-4">Recent Activity</h3>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {verifications.slice(0,5).map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{v.user}</span>
                          <span className="text-xs text-zinc-500 font-mono">{v.id}</span>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest ${v.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : v.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {v.status}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="glass-card p-6">
                 <h3 className="font-sans text-[11px] font-bold tracking-[1.5px] uppercase text-white/50 mb-2">Trust Score Distribution</h3>
                 <p className="text-[10px] text-zinc-600 mb-4">Composite trust score per registered user</p>
                 <TrustBarChart users={users} />
               </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6 animate-fade-in z-10 relative">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[24px] font-medium text-[#E6EAF2]">User Management</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" placeholder="Search users..." className="input-field pl-9 py-2 text-sm w-64" />
              </div>
            </div>
            
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-black/40 text-[11px] font-sans tracking-[1.5px] uppercase text-white/50 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-medium">User ID</th>
                      <th className="px-6 py-4 font-medium">Username</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Last Activity</th>
                      <th className="px-6 py-4 font-medium">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setSelectedUser(user)}>
                        <td className="px-6 py-4 font-mono">{user.id}</td>
                        <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest border ${
                            user.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            user.status === 'FLAGGED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{user.lastActivity}</td>
                        <td className="px-6 py-4"><FraudBadge score={user.risk} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'verifications':
        return (
          <div className="space-y-6 animate-fade-in z-10 relative">
            <h2 className="font-serif text-[24px] font-medium text-[#E6EAF2]">Verification Queue</h2>
            
            <div className="space-y-4">
               {verifications.map(ver => (
                 <div key={ver.id} className="glass-card p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center">
                          <ShieldCheck className={`w-6 h-6 ${ver.matchScore > 80 ? 'text-emerald-400' : ver.matchScore > 50 ? 'text-amber-400' : 'text-rose-400'}`} />
                       </div>
                       <div>
                         <p className="text-white font-medium">{ver.user}</p>
                         <p className="text-xs text-zinc-500 font-mono mt-1">{ver.id} • {ver.time}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                       <div className="text-right hidden md:block">
                         <p className="font-sans text-[10px] tracking-[1.5px] uppercase text-white/50">Face Match</p>
                         <p className={`font-mono font-bold ${ver.matchScore > 80 ? 'text-emerald-400' : ver.matchScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>{ver.matchScore}%</p>
                       </div>
                       
                       <div className="flex gap-2">
                          <button className="btn-ghost !p-2 text-emerald-400 hover:bg-emerald-500/20" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                          <button className="btn-ghost !p-2 text-rose-400 hover:bg-rose-500/20" title="Reject"><XCircle className="w-4 h-4" /></button>
                          <button className="btn-ghost !p-2 text-amber-400 hover:bg-amber-500/20" title="Flag"><Flag className="w-4 h-4" /></button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-background max-w-7xl mx-auto z-10 relative">
      {/* Sidebar Nav */}
      <div className="w-64 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl p-6 flex flex-col sticky top-0 h-screen z-20">
        <div className="mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h1 className="font-serif text-[20px] font-medium tracking-tight text-[#E6EAF2]">Admin Panel</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                activeTab === tab.id 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-all text-left"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto z-10">
        {renderContent()}
      </div>
      
      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 relative"
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <h3 className="font-serif text-[24px] font-medium text-[#E6EAF2] mb-4">User Details</h3>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-sans text-xs uppercase tracking-widest">Username</span>
                  <span className="text-white">{selectedUser.username}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-sans text-xs uppercase tracking-widest">ID</span>
                  <span className="text-blue-400">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-sans text-xs uppercase tracking-widest">Status</span>
                  <span>{selectedUser.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans text-xs uppercase tracking-widest">Risk</span>
                  <span><FraudBadge score={selectedUser.risk} /></span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, change, accent = 'blue' }) {
  const isPositive = change.startsWith('+');
  return (
    <div className="glass-card p-5 border-t-2" style={{ borderTopColor: accent === 'rose' ? '#f43f5e' : '#3b82f6' }}>
      <h3 className="font-sans text-[11px] font-bold tracking-[1.5px] uppercase text-white/50 mb-2">{title}</h3>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <span className={`text-xs mb-1 font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{change}</span>
      </div>
    </div>
  );
}

function TrustBarChart({ users }) {
  const [hovered, setHovered] = useState(null);
  const CHART_H = 160; // px — matches h-44 minus label row

  const getBarStyle = (score) => {
    if (score >= 70) return { bg: 'rgba(52,211,153,0.25)', hover: 'rgba(52,211,153,0.5)', text: '#34d399', label: 'HIGH' };
    if (score >= 40) return { bg: 'rgba(251,191,36,0.2)',  hover: 'rgba(251,191,36,0.45)', text: '#fbbf24', label: 'MED'  };
    return           { bg: 'rgba(248,113,113,0.2)',  hover: 'rgba(248,113,113,0.45)', text: '#f87171', label: 'LOW'  };
  };

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-zinc-600 gap-2" style={{ height: CHART_H + 40 }}>
        <Activity className="w-8 h-8 opacity-30" />
        <p className="text-xs">No user data yet</p>
      </div>
    );
  }

  return (
    <div className="relative select-none">
      {/* Grid lines */}
      <div className="relative" style={{ height: CHART_H }}>
        {[25, 50, 75, 100].map(pct => (
          <div
            key={pct}
            className="absolute left-0 right-0 border-t border-white/5 flex items-start"
            style={{ bottom: `${pct}%` }}
          >
            <span className="text-[8px] text-zinc-700 font-mono leading-none">{pct}</span>
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex gap-2 items-end px-1">
          {users.map((user, i) => {
            // composite_score is 0-1 (fraction), convert to 0-100
            const score = user.risk > 1 ? user.risk : user.risk * 100;
            const clampedScore = Math.min(100, Math.max(0, score));
            const barPx = Math.max(4, (clampedScore / 100) * CHART_H);
            const style = getBarStyle(clampedScore);
            const isHov = hovered === i;

            return (
              <div
                key={user.id || i}
                className="flex-1 flex flex-col items-center cursor-pointer relative"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHov && (
                  <div className="absolute z-20 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-center whitespace-nowrap shadow-xl"
                    style={{ bottom: barPx + 8, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <p className="text-[10px] text-white font-mono font-bold">{clampedScore.toFixed(1)}%</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: style.text }}>{style.label}</p>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: barPx,
                    background: isHov ? style.hover : style.bg,
                    border: `1px solid ${style.text}44`,
                    boxShadow: isHov ? `0 0 14px ${style.text}50` : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Username labels */}
      <div className="flex gap-2 px-1 mt-1">
        {users.map((user, i) => {
          const score = user.risk > 1 ? user.risk : user.risk * 100;
          const style = getBarStyle(Math.min(100, Math.max(0, score)));
          return (
            <p
              key={user.id || i}
              className="flex-1 text-[8px] font-mono truncate text-center transition-colors"
              style={{ color: hovered === i ? style.text : '#52525b' }}
            >
              {(user.username || 'usr').slice(0, 8)}
            </p>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-end">
        {[{ c: '#34d399', l: 'High (≥70)' }, { c: '#fbbf24', l: 'Med (40–69)' }, { c: '#f87171', l: 'Low (<40)' }].map(({ c, l }) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c + '55', border: `1px solid ${c}66` }} />
            <span className="text-[9px] text-zinc-600 font-sans">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
