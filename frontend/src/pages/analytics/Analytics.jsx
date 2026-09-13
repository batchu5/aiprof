import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Bot,
  HelpCircle,
  Zap,
  Calendar,
  RefreshCw,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { analyticsApi } from '../../services/api';

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState(null);
  const [aiUsageData, setAiUsageData] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTrendTab, setActiveTrendTab] = useState('activity');

  useEffect(() => {
    fetchGlobalAnalytics();
  }, [dateRange]);

  const fetchGlobalAnalytics = async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
      const [globalRes, aiRes] = await Promise.all([
        analyticsApi.getGlobalAnalytics(),
        analyticsApi.getAiUsageStats({ days })
      ]);
      setGlobalData(globalRes);
      setAiUsageData(aiRes);
    } catch (err) {
      console.error('Error fetching global analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Aggregating global learning analytics across all spaces & projects..." />;

  const overall = globalData?.overall_learning || {};
  const perf = globalData?.learning_performance || {};
  const aiUsage = globalData?.ai_usage || {};
  const trends = globalData?.trends || {};
  const topProjects = globalData?.top_projects || [];
  const areasToImprove = globalData?.areas_to_improve || [];

  // Trend data selector
  let activeTrendData = trends.activity_over_time || [];
  let trendDataKey = 'count';
  let trendColor = '#6366f1';

  if (activeTrendTab === 'mastery') {
    activeTrendData = trends.mastery_over_time || [];
    trendDataKey = 'avg_mastery';
    trendColor = '#10b981';
  } else if (activeTrendTab === 'quiz') {
    activeTrendData = trends.quiz_performance_trend || [];
    trendDataKey = 'avg_score';
    trendColor = '#06b6d4';
  }

  // Feature usage bar data
  const rawByFeature = aiUsageData?.by_feature || {};
  const featureBarData = Object.keys(rawByFeature).length > 0
    ? Object.entries(rawByFeature).map(([k, v]) => ({ name: k.replace('_', ' ').toUpperCase(), count: v }))
    : [
        { name: 'TUTOR CHAT', count: 0 },
        { name: 'QUIZ GEN', count: 0 },
        { name: 'EVALUATION', count: 0 },
        { name: 'RECOMMENDATIONS', count: 0 }
      ];

  const totalConcepts = perf.total_concepts || 0;
  const masteredPct = totalConcepts > 0 ? Math.round(((perf.concepts_mastered || 0) / totalConcepts) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 py-6">
      {/* Header & Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            Global Learning Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Comprehension performance and study telemetry</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-white/90 border border-slate-200 p-1.5 rounded-xl">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRange === range.id
                  ? 'bg-blue-700 text-slate-900 shadow-md shadow-blue-600/20'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROW 1: OVERVIEW STATS (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-indigo-400 border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Spaces</p>
            <p className="text-xl font-bold text-slate-900">{overall.total_spaces ?? 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Projects</p>
            <p className="text-xl font-bold text-slate-900">{overall.total_projects ?? 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-purple-400 border border-blue-600/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Materials</p>
            <p className="text-xl font-bold text-slate-900">{overall.total_materials ?? 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Days</p>
            <p className="text-xl font-bold text-slate-900">{overall.active_days ?? 0}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Current Streak</p>
            <p className="text-xl font-bold text-amber-400">{overall.current_streak ?? 0} Days 🔥</p>
          </div>
        </div>
      </div>

      {/* ROW 2: LEARNING PROGRESS (Circular Mastery & Concept Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Overall Mastery Circular Gauge */}
        <Card title="Overall Comprehension Mastery" subtitle="Aggregated score across all concepts">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" className="text-slate-200" strokeWidth="10" stroke="currentColor" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * (perf.overall_mastery || 0)) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-900">{Math.round(perf.overall_mastery || 0)}%</span>
                <span className="text-[10px] uppercase font-bold text-purple-300">Mastery</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center max-w-xs">
              Based on adaptive quizzes and RAG tutor sessions.
            </p>
          </div>
        </Card>

        {/* Right: Concepts Mastered vs Total Stacked Breakdown */}
        <div className="lg:col-span-2">
          <Card title="Concept Distribution Breakdown" subtitle="Distribution across mastery states">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-xs text-emerald-400 font-bold uppercase">Mastered (≥80%)</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{perf.concepts_mastered ?? 0}</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-xs text-indigo-400 font-bold uppercase">Improving (50-79%)</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{perf.concepts_improving ?? 0}</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-xs text-amber-400 font-bold uppercase">Needs Attention (&lt;50%)</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{perf.concepts_needing_attention ?? 0}</p>
              </div>
            </div>

            {/* Stacked Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Total Concepts Tracked: {totalConcepts}</span>
                <span>{masteredPct}% Mastered</span>
              </div>
              <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden flex border border-slate-200">
                {totalConcepts > 0 ? (
                  <>
                    <div className="h-full bg-emerald-500" style={{ width: `${((perf.concepts_mastered || 0) / totalConcepts) * 100}%` }} />
                    <div className="h-full bg-blue-500" style={{ width: `${((perf.concepts_improving || 0) / totalConcepts) * 100}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${((perf.concepts_needing_attention || 0) / totalConcepts) * 100}%` }} />
                  </>
                ) : (
                  <div className="h-full w-full bg-white" />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ROW 3: TABBED TIME SERIES TRENDS (Full Width) */}
      <Card title="Learning Trajectory Trends" subtitle="Time-series analysis of activity, comprehension mastery, and quiz accuracy">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'activity', label: 'Activity Volume', icon: Clock },
              { id: 'mastery', label: 'Mastery Progression', icon: TrendingUp },
              { id: 'quiz', label: 'Quiz Accuracy', icon: HelpCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTrendTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTrendTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-700 text-slate-900 shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={trendColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey={trendDataKey} stroke={trendColor} strokeWidth={2.5} fillOpacity={1} fill="url(#trendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROW 4: TOP PROJECTS LEADERBOARD & AREAS TO IMPROVE (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Top Projects Leaderboard */}
        <Card title="Top Performing Projects" subtitle="Ranked by overall comprehension mastery">
          {topProjects.length > 0 ? (
            <div className="space-y-3 mt-2">
              {topProjects.map((proj, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white text-slate-500'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{proj.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{proj.space_name}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-400 text-sm">{proj.mastery}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center bg-white/40 border border-slate-200/80 rounded-xl my-2">
              <FolderOpen className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">No Analytics Data Available Yet</p>
              <p className="text-xs text-slate-500 mt-1">Create study projects and complete quizzes to track project performance.</p>
            </div>
          )}
        </Card>

        {/* Right: Areas Needing Attention */}
        <Card title="Priority Areas to Improve" subtitle="Target concepts requiring additional focus">
          {areasToImprove.length > 0 ? (
            <div className="space-y-3 mt-2">
              {areasToImprove.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.concept}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Project: {item.project}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-amber-400 text-sm">{item.mastery}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center bg-white/40 border border-slate-200/80 rounded-xl my-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">No Weak Areas Identified</p>
              <p className="text-xs text-slate-500 mt-1">Start studying or take quizzes to identify concepts needing target review.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ROW 5: AI USAGE TELEMETRY STATS & FEATURE BAR CHART */}
      <Card title="AI Telemetry & Feature Usage" subtitle="Usage distribution across AI tutor, quiz authoring, and evaluation">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Tutor Questions Asked</p>
              <p className="text-xl font-bold text-slate-900">{aiUsage.total_tutor_questions ?? 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Quizzes Generated</p>
              <p className="text-xl font-bold text-slate-900">{aiUsage.total_quizzes ?? 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">AI Feedbacks Processed</p>
              <p className="text-xl font-bold text-slate-900">{aiUsage.total_ai_feedback ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Feature Usage Bar Chart */}
        <div className="h-56 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
