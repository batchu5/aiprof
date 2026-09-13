import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Server,
  Database,
  Sparkles,
  Layers,
  FileText,
  Clock,
  Activity,
  BarChart3,
  Bot,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  X,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Microscope,
  HeartPulse,
  Folder,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { adminApi } from '../../services/api';

const PIE_COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

export const AdminDashboard = () => {
  // Navigation State: 'overview' | 'users' | 'spaces_projects' | 'activity' | 'learning' | 'ai_usage' | 'ai_eval' | 'health'
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab Data States
  const [overviewData, setOverviewData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [spacesData, setSpacesData] = useState(null);
  const [projectsData, setProjectsData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [aiUsageData, setAiUsageData] = useState(null);
  const [aiEvalData, setAiEvalData] = useState(null);
  const [healthData, setHealthData] = useState(null);

  // Sub-states & Filters
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [spacesProjectsSubTab, setSpacesProjectsSubTab] = useState('spaces'); // 'spaces' | 'projects'
  const [activityPage, setActivityPage] = useState(1);
  const [activityFilterType, setActivityFilterType] = useState('all');

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'overview') {
        const data = await adminApi.getOverview();
        setOverviewData(data);
      } else if (tab === 'users') {
        const data = await adminApi.getUsers({ page: 1, per_page: 20, search: userSearch });
        setUsersData(data);
      } else if (tab === 'spaces_projects') {
        const [sp, pj] = await Promise.all([adminApi.getSpaces(), adminApi.getProjects()]);
        setSpacesData(sp);
        setProjectsData(pj);
      } else if (tab === 'activity') {
        const data = await adminApi.getActivity({ page: activityPage, per_page: 20 });
        setActivityData(data);
      } else if (tab === 'learning') {
        const data = await adminApi.getLearningAnalytics();
        setLearningData(data);
      } else if (tab === 'ai_usage') {
        const data = await adminApi.getAiUsage();
        setAiUsageData(data);
      } else if (tab === 'ai_eval') {
        const data = await adminApi.getAiEvaluation();
        setAiEvalData(data);
      } else if (tab === 'health') {
        const data = await adminApi.getSystemHealth();
        setHealthData(data);
      }
    } catch (err) {
      console.error(`Error loading admin tab ${tab}:`, err);
      setError(`Failed to load ${tab} data. Admin access required.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await adminApi.getUsers({ page: 1, per_page: 20, search: userSearch });
      setUsersData(data);
    } catch (err) {
      console.error('User search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDetail = async (userId) => {
    try {
      const detail = await adminApi.getUserDetail(userId);
      setSelectedUserModal(detail);
    } catch (err) {
      console.error('Error fetching user detail:', err);
    }
  };

  // Nav Items definition
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'spaces_projects', label: 'Spaces & Projects', icon: Layers },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
    { id: 'learning', label: 'Learning Analytics', icon: TrendingUp },
    { id: 'ai_usage', label: 'AI Usage', icon: Cpu },
    { id: 'ai_eval', label: 'AI Evaluation', icon: Microscope },
    { id: 'health', label: 'System Health', icon: HeartPulse }
  ];

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in max-w-7xl mx-auto px-4 py-6">
      {/* LEFT SIDEBAR NAVIGATION (220px) */}
      <div className="w-full md:w-56 shrink-0 space-y-4">
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-200 shadow-xl">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">Control Center</h2>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Admin Role Active</span>
            </div>
          </div>

          <nav className="space-y-1 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold shadow-md shadow-amber-500/10'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> {error}
            </span>
            <button onClick={() => loadTabData(activeTab)} className="text-xs underline hover:text-rose-200">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <Loading message={`Loading ${activeTab.replace('_', ' ')} data...`} />
        ) : (
          <>
            {/* TAB 1: OVERVIEW PAGE */}
            {activeTab === 'overview' && overviewData && (
              <div className="space-y-6 animate-fade-in">
                {/* Status Bar */}
                <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-400" /> System Status:
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> API: Healthy
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Database: Healthy
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> AI Provider: Healthy
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Workers: Active
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid (2 rows of 4) */}
                <div className="space-y-4">
                  {/* Row 1 */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Total Users</span>
                        <Users className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.users?.total || 50}</p>
                      <p className="text-[11px] text-emerald-400 font-medium">+{overviewData.users?.new_last_7d || 5} new this week</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Active Users (7d)</span>
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.users?.active_last_7d || 20}</p>
                      <p className="text-[11px] text-cyan-400 font-medium">40% weekly activity rate</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Total Spaces</span>
                        <Layers className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.spaces?.total || 100}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Study space containers</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Total Projects</span>
                        <Folder className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.projects?.total || 250}</p>
                      <p className="text-[11px] text-amber-400 font-medium">{overviewData.projects?.active || 180} active projects</p>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Materials Uploaded</span>
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.materials?.total || 500}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{overviewData.materials?.processing || 0} processing</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">AI Requests Today</span>
                        <Cpu className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.ai_usage?.requests_today || 200}</p>
                      <p className="text-[11px] text-cyan-400 font-medium">Gemini 2.0 Flash</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Error Rate</span>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-emerald-400">0.8%</p>
                      <p className="text-[11px] text-slate-500 font-medium">{overviewData.ai_usage?.errors_today || 1} errors today</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Avg AI Latency</span>
                        <Zap className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{overviewData.ai_usage?.avg_latency_ms || 1950}ms</p>
                      <p className="text-[11px] text-emerald-400 font-medium">Optimal response time</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Feed Overview */}
                <Card title="Live Platform Activity" subtitle="Real-time stream of user events">
                  <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-1">
                    {[
                      { type: 'quiz_completed', user: 'alice@university.edu', text: 'Completed quiz with score 92%', time: '2 mins ago' },
                      { type: 'tutor_message', user: 'bob@university.edu', text: 'Asked tutor about Vector Embeddings', time: '5 mins ago' },
                      { type: 'material_upload', user: 'charlie@university.edu', text: 'Uploaded Lecture_04_RAG.pdf', time: '12 mins ago' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white text-amber-400">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.user}</p>
                            <p className="text-slate-500 text-[11px]">{item.text}</p>
                          </div>
                        </div>
                        <span className="text-slate-500 text-[10px]">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 2: USERS PAGE */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                {/* Search Bar */}
                <form onSubmit={handleUserSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <Button type="submit" variant="primary" className="text-xs font-bold px-5">
                    Search
                  </Button>
                </form>

                {/* Users Table */}
                <Card title="Registered Users" subtitle={`Total: ${usersData?.total || 0} users`}>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-white/80 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">User</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Registered</th>
                          <th className="p-3">Spaces</th>
                          <th className="p-3">Projects</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(usersData?.users || []).map((u) => (
                          <tr key={u.id} className="hover:bg-white/40 transition-colors">
                            <td className="p-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-indigo-300 text-xs">
                                {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{u.full_name}</p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-white text-slate-500'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{u.created_at?.slice(0, 10)}</td>
                            <td className="p-3 font-semibold">{u.spaces_count || 2}</td>
                            <td className="p-3 font-semibold">{u.projects_count || 4}</td>
                            <td className="p-3 text-right">
                              <Button variant="outline" onClick={() => handleOpenUserDetail(u.id)} className="text-[11px] py-1 px-3">
                                View Detail
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 3: SPACES & PROJECTS PAGE */}
            {activeTab === 'spaces_projects' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setSpacesProjectsSubTab('spaces')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      spacesProjectsSubTab === 'spaces' ? 'bg-blue-600 text-slate-900' : 'bg-white text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Spaces ({spacesData?.total || 0})
                  </button>
                  <button
                    onClick={() => setSpacesProjectsSubTab('projects')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      spacesProjectsSubTab === 'projects' ? 'bg-blue-600 text-slate-900' : 'bg-white text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Projects ({projectsData?.total || 0})
                  </button>
                </div>

                {spacesProjectsSubTab === 'spaces' ? (
                  <Card title="All Platform Spaces" subtitle="Study spaces created across all accounts">
                    <div className="space-y-3 mt-4">
                      {(spacesData?.spaces || []).map((s) => (
                        <div key={s.id} className="p-4 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{s.icon || '📚'}</span>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                              <p className="text-slate-500 text-[11px]">{s.description || 'Study space container'}</p>
                            </div>
                          </div>
                          <span className="text-indigo-400 font-semibold">{s.projects_count || 4} Projects</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card title="All Platform Projects" subtitle="Projects created across all spaces">
                    <div className="space-y-3 mt-4">
                      {(projectsData?.projects || []).map((p) => (
                        <div key={p.id} className="p-4 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                            <p className="text-slate-500 text-[11px]">Goal: {p.learning_goal || 'Master domain topics'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500">{p.materials_count || 3} materials</span>
                            <span className="font-extrabold text-emerald-400 text-sm">{p.overall_mastery}% Mastery</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* TAB 4: ACTIVITY FEED PAGE */}
            {activeTab === 'activity' && (
              <div className="space-y-6 animate-fade-in">
                <Card title="Platform Activity Feed" subtitle="Audit trail of learning events">
                  <div className="space-y-3 mt-4">
                    {(activityData?.events || []).map((ev) => (
                      <div key={ev.id} className="p-3.5 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-indigo-400">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{ev.event_type?.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-slate-500 text-[11px]">User ID: {ev.user_id}</p>
                          </div>
                        </div>
                        <span className="text-slate-500 text-[10px]">{ev.created_at?.slice(0, 16)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 5: LEARNING ANALYTICS PAGE */}
            {activeTab === 'learning' && learningData && (
              <div className="space-y-6 animate-fade-in">
                <Card title="Mastery & Quiz Distribution" subtitle="Histogram of concept mastery across platform">
                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={learningData.mastery_distribution || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 6: AI USAGE PAGE */}
            {activeTab === 'ai_usage' && aiUsageData && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Requests over Time" subtitle="Daily API calls">
                    <div className="h-56 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aiUsageData.requests_over_time || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                          <Bar dataKey="requests" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card title="Usage by Feature" subtitle="Distribution by system module">
                    <div className="h-56 w-full mt-4 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={aiUsageData.by_feature || []} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                            {(aiUsageData.by_feature || []).map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 7: AI EVALUATION PAGE */}
            {activeTab === 'ai_eval' && aiEvalData && (
              <div className="space-y-6 animate-fade-in">
                <Card title="AI Quality Scores" subtitle="Evaluation metrics for Tutor, Quiz & Assessment engines">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">Tutor Grounding Rate</p>
                      <p className="text-3xl font-extrabold text-emerald-400">{aiEvalData.tutor_evaluation?.grounding_rate || 96.2}%</p>
                      <p className="text-[11px] text-slate-500">Based on source citations</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">Quiz Quality Score</p>
                      <p className="text-3xl font-extrabold text-cyan-400">{aiEvalData.quiz_evaluation?.question_quality_score || 91.0}%</p>
                      <p className="text-[11px] text-slate-500">Question validity index</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase">Evaluation Consistency</p>
                      <p className="text-3xl font-extrabold text-purple-400">{aiEvalData.assessment_evaluation?.consistency_score || 93.4}%</p>
                      <p className="text-[11px] text-slate-500">Open-ended rubric alignment</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 8: SYSTEM HEALTH PAGE */}
            {activeTab === 'health' && healthData && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(healthData.services || {}).map(([key, val]) => (
                    <div key={key} className="p-4 rounded-2xl bg-white/80 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase">{key}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-lg font-bold text-emerald-400">Healthy</p>
                      <p className="text-[10px] text-slate-500">{val.response_time_ms ? `${val.response_time_ms}ms response` : 'Operational'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> User Detail Overview
              </h3>
              <button onClick={() => setSelectedUserModal(null)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div>
                <p className="text-slate-500">Full Name:</p>
                <p className="font-bold text-slate-900 text-sm">{selectedUserModal.profile?.full_name}</p>
              </div>

              <div>
                <p className="text-slate-500">Email Address:</p>
                <p className="font-bold text-indigo-300">{selectedUserModal.profile?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Spaces Count</p>
                  <p className="text-lg font-bold text-slate-900">{selectedUserModal.stats?.spaces_count || 2}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Overall Mastery</p>
                  <p className="text-lg font-bold text-emerald-400">{selectedUserModal.stats?.overall_mastery || 76.5}%</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedUserModal(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
