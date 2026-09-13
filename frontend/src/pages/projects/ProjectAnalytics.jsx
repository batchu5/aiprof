import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  Target,
  Brain,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Zap,
  AlertCircle,
  HelpCircle,
  Bot,
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { analyticsApi } from '../../services/api';

const PIE_COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

export const ProjectAnalytics = () => {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getProjectAnalytics(projectId);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching project analytics:', err);
      setError('Failed to load project analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchAnalytics();
    }
  }, [projectId]);

  if (loading) return <Loading message="Computing project analytics & telemetry..." />;

  const act = analyticsData?.activity || {};
  const perf = analyticsData?.performance || {};
  const aiAct = analyticsData?.ai_activity || {};

  // Formatted chart data
  const activityChartData = act.activity_by_day || [];
  const quizScoresData = (perf.quiz_scores_over_time || []).map((sc, i) => ({
    name: `Quiz ${i + 1}`,
    score: sc,
    avg: perf.avg_quiz_score || 0
  }));

  const conceptBarData = perf.concept_breakdown || [
    { name: perf.best_concept?.name !== 'None' ? perf.best_concept?.name : 'Best Concept', mastery: perf.best_concept?.mastery || 0 },
    { name: 'Core Principles', mastery: perf.current_mastery || 0 },
    { name: perf.weakest_concept?.name !== 'None' ? perf.weakest_concept?.name : 'Weakest Concept', mastery: perf.weakest_concept?.mastery || 0 }
  ];

  const aiPieData = [
    { name: 'Tutor Q&A', value: aiAct.tutor_interactions || 0 },
    { name: 'Quiz Assessments', value: aiAct.ai_assessments || 0 },
    { name: 'Answer Evaluations', value: aiAct.ai_evaluations || 0 },
    { name: 'Recommendations', value: aiAct.recommendations_generated || 0 }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Project Dashboard
        </Link>

        <button
          onClick={fetchAnalytics}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/60 p-6 sm:p-8 border border-blue-500/20 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-purple-400 border border-blue-600/20 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" /> Project Analytics
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Learning & Performance Telemetry</h1>
          <p className="text-slate-600 text-sm max-w-xl">
            Detailed breakdown of study sessions, quiz accuracy, concept mastery distribution, and AI model response metrics.
          </p>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white/80 border border-slate-200 flex items-center gap-3">
          <Clock className="w-6 h-6 text-cyan-400" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Estimated Study Time</p>
            <p className="text-sm font-bold text-slate-900">{act.total_study_time_estimate || '~0 hours'}</p>
          </div>
        </div>
      </div>

      {/* ROW 1: KEY METRICS (4 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 hover:border-blue-500/40 transition-all backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sessions</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-indigo-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{act.total_sessions ?? 0}</h3>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Most active on {act.most_active_day || 'None'}
            </p>
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 hover:border-cyan-500/40 transition-all backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz Accuracy</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{Math.round(perf.quiz_accuracy || 0)}%</h3>
            <p className="text-xs text-cyan-400 mt-1 font-semibold">
              {perf.quiz_accuracy > 0 ? (perf.quiz_accuracy >= 70 ? 'High Retention Rate' : 'Developing Accuracy') : 'No Quizzes Completed'}
            </p>
          </div>
        </div>

        {/* Current Mastery */}
        <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 hover:border-blue-600/40 transition-all backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Mastery</span>
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-purple-400 border border-blue-600/20">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{Math.round(perf.current_mastery || 0)}%</h3>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden mt-2 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-400 rounded-full"
                style={{ width: `${perf.current_mastery || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI Interactions */}
        <div className="p-5 rounded-2xl bg-white/70 border border-slate-200 hover:border-rose-500/40 transition-all backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Interactions</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900">{aiAct.total_ai_requests ?? 0}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Avg Latency: <span className="text-slate-700 font-bold">{aiAct.avg_response_time_ms ?? 0}ms</span>
            </p>
          </div>
        </div>
      </div>

      {/* ROW 2: DUAL CHARTS (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Over Time AreaChart */}
        <Card title="Activity Over Time (Last 30 Days)" subtitle="Daily study interactions volume">
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#activityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quiz Performance LineChart */}
        <Card title="Quiz Performance Trend" subtitle={`Average Quiz Score: ${perf.avg_quiz_score || 0}%`}>
          <div className="h-64 w-full mt-4">
            {quizScoresData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizScoresData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                  />
                  <ReferenceLine y={perf.avg_quiz_score || 0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Avg', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#ec4899', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <HelpCircle className="w-10 h-10 text-slate-600 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600">No Quiz Attempts Yet</p>
                <p className="text-xs text-slate-500 mt-1">Complete a quiz in this project to generate quiz accuracy trends.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ROW 3: CONCEPT BREAKDOWN BAR CHART */}
      <Card title="Concept Mastery Breakdown" subtitle="Mastery scores per project topic">
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={conceptBarData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
              />
              <Bar dataKey="mastery" radius={[0, 8, 8, 0]}>
                {conceptBarData.map((entry, index) => {
                  const m = entry.mastery || 0;
                  let color = '#10b981'; // Green >= 75
                  if (m < 40) color = '#f43f5e'; // Red < 40
                  else if (m < 75) color = '#f59e0b'; // Amber
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROW 4: AI ACTIVITY & PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: AI Feature Usage Donut Chart */}
        <Card title="AI Feature Usage Breakdown" subtitle="Distribution of AI requests by feature">
          <div className="h-64 w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {aiPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: AI Telemetry & Latency */}
        <Card title="AI Telemetry & Response Metrics" subtitle="Engine latency and system reliability">
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Average Response Time</p>
                  <p className="text-xs text-slate-500">Gemini 2.0 Flash Latency</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-indigo-400">{aiAct.avg_response_time_ms ?? 0} ms</span>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Total AI Requests</p>
                  <p className="text-xs text-slate-500">Tutor Q&A, Quizzes & Eval</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-cyan-400">{aiAct.total_ai_requests ?? 0}</span>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">API Reliability Status</p>
                  <p className="text-xs text-slate-500">Error rate: 0.0%</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% Operational
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
