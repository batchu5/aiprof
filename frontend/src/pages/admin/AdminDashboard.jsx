import React from 'react';
import { Shield, Users, Server, Database, Sparkles } from 'lucide-react';
import Card from '../../components/common/Card';

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          Admin Control Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">System health, Gemini API quota usage, and user management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Users</p>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">142</h3>
            </div>
          </div>
        </Card>

        <Card className="hover:border-indigo-500/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">API Status</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-0.5">Healthy (200 OK)</h3>
            </div>
          </div>
        </Card>

        <Card className="hover:border-cyan-500/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Vector Index Size</p>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">1,204 Chunks</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Admin Dashboard - Coming Soon</h2>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Comprehensive user management, system audit logs, and Gemini Flash rate limit controls are being synthesized.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
